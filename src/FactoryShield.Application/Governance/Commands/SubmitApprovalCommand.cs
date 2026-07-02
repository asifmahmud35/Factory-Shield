using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Governance.Commands;

public record SubmitApprovalCommand(
    Guid IncidentId,
    ApprovalType ApprovalType,
    bool IsApprove,
    string? RejectionReason,
    Guid ActorId
) : IRequest;

public class SubmitApprovalCommandHandler : IRequestHandler<SubmitApprovalCommand>
{
    private readonly IIncidentRepository _incidents;
    private readonly IApprovalEventRepository _events;
    private readonly ICorrectiveActionRepository _capa;
    private readonly IIncidentStateMachine _stateMachine;
    private readonly IIncidentStateLogger _logger;
    private readonly INotificationDispatcher _dispatcher;

    public SubmitApprovalCommandHandler(
        IIncidentRepository incidents,
        IApprovalEventRepository events,
        ICorrectiveActionRepository capa,
        IIncidentStateMachine stateMachine,
        IIncidentStateLogger logger,
        INotificationDispatcher dispatcher)
    {
        _incidents = incidents;
        _events = events;
        _capa = capa;
        _stateMachine = stateMachine;
        _logger = logger;
        _dispatcher = dispatcher;
    }

    private static readonly Dictionary<IncidentStatus, ApprovalType> _stateToGate = new()
    {
        [IncidentStatus.Investigation]  = ApprovalType.CloseInvestigation,
        [IncidentStatus.RcaReview]      = ApprovalType.RootCauseSignOff,
        [IncidentStatus.Verification]   = ApprovalType.CapaVerification,
        [IncidentStatus.Resolved]       = ApprovalType.ResolutionFinal,
    };

    private static readonly Dictionary<ApprovalType, IncidentStatus> _gateAdvance = new()
    {
        [ApprovalType.CloseInvestigation] = IncidentStatus.RcaReview,
        [ApprovalType.RootCauseSignOff]   = IncidentStatus.CapaExecution,
        [ApprovalType.CapaVerification]   = IncidentStatus.Resolved,
        [ApprovalType.ResolutionFinal]    = IncidentStatus.Closed,
    };

    private static readonly Dictionary<ApprovalType, IncidentStatus?> _gateReject = new()
    {
        [ApprovalType.CloseInvestigation] = null,
        [ApprovalType.RootCauseSignOff]   = IncidentStatus.Investigation,
        [ApprovalType.CapaVerification]   = IncidentStatus.CapaExecution,
        [ApprovalType.ResolutionFinal]    = null,
    };

    private static readonly Dictionary<ApprovalType, ApprovalType?> _previousGate = new()
    {
        [ApprovalType.CloseInvestigation] = null,
        [ApprovalType.RootCauseSignOff]   = ApprovalType.CloseInvestigation,
        [ApprovalType.CapaVerification]   = ApprovalType.RootCauseSignOff,
        [ApprovalType.ResolutionFinal]    = ApprovalType.CapaVerification,
    };

    public async Task Handle(SubmitApprovalCommand request, CancellationToken ct)
    {
        var incident = await _incidents.FindByIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        if (!_stateToGate.TryGetValue(incident.Status, out var expectedGate) ||
            expectedGate != request.ApprovalType)
        {
            throw new InvalidOperationException(
                $"Incident is at '{incident.Status}' — the active gate is '{(_stateToGate.TryGetValue(incident.Status, out var g) ? g : "none")}', not '{request.ApprovalType}'.");
        }

        var existingVotes = await _events.GetByIncidentAndTypeAsync(
            request.IncidentId, request.ApprovalType, ct);

        if (existingVotes.Any(v => v.ActorId == request.ActorId))
            throw new InvalidOperationException("You have already submitted a vote for this approval gate.");

        if (_previousGate[request.ApprovalType] is ApprovalType prev)
        {
            var prevVotes = await _events.GetByIncidentAndTypeAsync(request.IncidentId, prev, ct);
            if (prevVotes.Any(v => v.ActorId == request.ActorId && v.IsApprove))
                throw new UnauthorizedAccessException(
                    "Separation of Duties violation: you approved the previous gate on this incident.");
        }

        if (!request.IsApprove && string.IsNullOrWhiteSpace(request.RejectionReason))
            throw new ArgumentException("A rejection reason is required.");

        await _events.AddAsync(new ApprovalEvent
        {
            Id              = Guid.NewGuid(),
            IncidentId      = request.IncidentId,
            ApprovalType    = request.ApprovalType,
            ActorId         = request.ActorId,
            IsApprove       = request.IsApprove,
            RejectionReason = request.RejectionReason,
            SubmittedAt     = DateTime.UtcNow,
        }, ct);

        var fromStatus = incident.Status.ToString();
        string? toStatus = null;

        if (!request.IsApprove)
        {
            var revertTo = _gateReject[request.ApprovalType];
            if (revertTo.HasValue)
            {
                _stateMachine.Transition(incident, revertTo.Value);
                toStatus = revertTo.Value.ToString();
            }

            if (request.ApprovalType == ApprovalType.CapaVerification)
            {
                var actions = await _capa.GetByIncidentIdAsync(request.IncidentId, ct);
                foreach (var action in actions)
                    action.CapaRejectionCount++;
                await _capa.SaveChangesAsync(ct);
            }
        }
        else
        {
            var approveCount = existingVotes.Count(v => v.IsApprove) + 1;
            if (approveCount >= 2)
            {
                var next = _gateAdvance[request.ApprovalType];
                _stateMachine.Transition(incident, next);
                toStatus = next.ToString();
            }
        }

        await _incidents.SaveChangesAsync(ct);
        await _events.SaveChangesAsync(ct);

        await _logger.LogAsync(
            incidentId: incident.Id,
            eventType: "APPROVAL",
            fromStatus: fromStatus,
            toStatus: toStatus,
            actorId: request.ActorId,
            actorRole: "ADMIN",
            description: request.IsApprove
                ? $"Approved gate: {request.ApprovalType}"
                : $"Rejected gate: {request.ApprovalType} — {request.RejectionReason}",
            visibilityScope: "RESTRICTED",
            ct: ct);

        // FS-28: Notify eligible approvers when gate fires (advance or reject)
        if (toStatus is not null)
        {
            await _dispatcher.DispatchAsync(new NotificationRequest(
                RecipientUserId: null,
                RecipientRole: "APPROVER",
                TriggerEvent: "APPROVAL_GATE",
                Title: $"Approval gate {request.ApprovalType} {(request.IsApprove ? "advanced" : "rejected")} — {incident.IncidentReference}",
                Message: request.IsApprove
                    ? $"Gate {request.ApprovalType} passed. Incident is now at stage: {toStatus}."
                    : $"Gate {request.ApprovalType} rejected. Reason: {request.RejectionReason}",
                DeepLinkPath: $"/approver/incidents/{incident.Id}",
                IncidentId: incident.Id,
                IdempotencyKey: $"approval_gate:{incident.Id}:{request.ApprovalType}:{request.ActorId}",
                Channels: ["InApp"]
            ), ct);
        }
    }
}
