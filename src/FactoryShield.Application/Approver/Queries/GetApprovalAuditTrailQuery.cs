using FactoryShield.Application.Approver.Models;
using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Approver.Queries;

public record GetApprovalAuditTrailQuery(Guid IncidentId) : IRequest<ApprovalAuditTrailDto>;

public class GetApprovalAuditTrailQueryHandler
    : IRequestHandler<GetApprovalAuditTrailQuery, ApprovalAuditTrailDto>
{
    private readonly IIncidentRepository _incidents;
    private readonly IApprovalEventRepository _approvals;
    private readonly IIncidentClaimRepository _claims;
    private readonly IRoutingLogRepository _routing;

    public GetApprovalAuditTrailQueryHandler(
        IIncidentRepository incidents,
        IApprovalEventRepository approvals,
        IIncidentClaimRepository claims,
        IRoutingLogRepository routing)
    {
        _incidents = incidents;
        _approvals = approvals;
        _claims    = claims;
        _routing   = routing;
    }

    public async Task<ApprovalAuditTrailDto> Handle(
        GetApprovalAuditTrailQuery request, CancellationToken ct)
    {
        var incident = await _incidents.FindByIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        var approvalEvents = await _approvals.GetByIncidentIdAsync(request.IncidentId, ct);
        var claimHistory   = await _claims.GetAllByIncidentIdAsync(request.IncidentId, ct);
        var routingEvents  = await _routing.GetByIncidentIdAsync(request.IncidentId, ct);

        var chain = approvalEvents.Select(ev => new ApprovalChainEntryDto(
            Gate:                  ev.ApprovalType.ToString(),
            ApprovalLevelAtAction: (int)ev.ApprovalType,
            ActorName:             ev.Actor?.Name ?? ev.ActorId.ToString(),
            ActorRole:             ev.Actor?.Role?.Code ?? "ADMIN",
            IsApprove:             ev.IsApprove,
            RejectionReason:       ev.RejectionReason,
            SubmittedAt:           ev.SubmittedAt
        )).ToList();

        var claims = claimHistory.Select(c => new ClaimHistoryEntryDto(
            ApproverName:    c.ClaimedBy?.Name ?? c.ClaimedById.ToString(),
            ApproverRole:    c.ClaimedBy?.Role?.Code ?? "APPROVER",
            ClaimedAt:       c.ClaimedAt,
            ExpiresAt:       c.ExpiresAt,
            IsActive:        c.IsActive,
            DurationMinutes: (int)(c.ExpiresAt - c.ClaimedAt).TotalMinutes
        )).ToList();

        var routes = routingEvents.Select(r => new RoutingEventDto(
            PreviousCategory:   r.PreviousCategory,
            NewCategory:        r.NewCategory,
            PreviousSeverity:   r.PreviousSeverity,
            NewSeverity:        r.NewSeverity,
            ChangedByName:      r.ChangedBy?.Name ?? r.ChangedById.ToString(),
            Reason:             r.Reason,
            ChangedAt:          r.ChangedAt,
            TriggeredLoopGuard: incident.LoopGuardTriggered && r == routingEvents.Last()
        )).ToList();

        return new ApprovalAuditTrailDto(
            IncidentId:              incident.Id,
            IncidentReference:       incident.IncidentReference,
            CurrentEscalationLevel:  incident.EscalationLevel,
            LoopGuardTriggered:      incident.LoopGuardTriggered,
            RouteCount:              incident.RouteCount,
            ApprovalChain:           chain,
            ClaimHistory:            claims,
            RoutingEvents:           routes
        );
    }
}
