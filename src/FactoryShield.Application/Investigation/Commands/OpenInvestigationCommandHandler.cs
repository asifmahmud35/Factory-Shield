using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Investigations.Commands;

public class OpenInvestigationCommandHandler : IRequestHandler<OpenInvestigationCommand, Guid>
{
    private readonly IIncidentRepository _incidents;
    private readonly IInvestigationRepository _investigations;
    private readonly IIncidentStateMachine _stateMachine;

    public OpenInvestigationCommandHandler(
        IIncidentRepository incidents,
        IInvestigationRepository investigations,
        IIncidentStateMachine stateMachine)
    {
        _incidents = incidents;
        _investigations = investigations;
        _stateMachine = stateMachine;
    }

    public async Task<Guid> Handle(OpenInvestigationCommand request, CancellationToken cancellationToken)
    {
        var incident = await _incidents.FindByIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        // Idempotent — return existing investigation if already opened
        var existing = await _investigations.FindByIncidentIdAsync(request.IncidentId, cancellationToken);
        if (existing is not null)
            return existing.Id;

        if (incident.Status == IncidentStatus.Assigned)
            _stateMachine.Transition(incident, IncidentStatus.InProgress);

        var now = DateTime.UtcNow;

        var investigation = new Investigation
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            OpenedAt = now,
            InvestigationStatus = "IN_PROGRESS",
            ChecklistItems = BuildChecklist(),
            TimelineEvents =
            [
                new InvestigationTimelineEvent
                {
                    Id = Guid.NewGuid(),
                    EventType = "INVESTIGATION_OPENED",
                    Description = "Investigation workspace opened.",
                    OccurredAt = now,
                    ActorId = request.OpenedByUserId
                }
            ]
        };

        await _investigations.AddAsync(investigation, cancellationToken);
        await _investigations.SaveChangesAsync(cancellationToken);
        await _incidents.SaveChangesAsync(cancellationToken);

        return investigation.Id;
    }

    private static List<InvestigationChecklistItem> BuildChecklist() =>
    [
        Item(1, "Review incident scene photos and videos"),
        Item(2, "Collect witness statements from all involved parties"),
        Item(3, "Inspect equipment and machinery involved"),
        Item(4, "Check PPE compliance records"),
        Item(5, "Review previous incidents in same area"),
        Item(6, "Document environmental conditions at time of incident"),
        Item(7, "Review relevant SOPs and work instructions"),
        Item(8, "Assess training records of involved personnel"),
    ];

    private static InvestigationChecklistItem Item(int order, string label) => new()
    {
        Id = Guid.NewGuid(),
        SortOrder = order,
        Label = label,
        IsCompleted = false
    };
}
