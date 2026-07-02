using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Investigations.Models;
using MediatR;

namespace FactoryShield.Application.Investigations.Queries;

public class GetInvestigationQueryHandler : IRequestHandler<GetInvestigationQuery, InvestigationWorkspaceDto>
{
    private readonly IInvestigationRepository _investigations;

    public GetInvestigationQueryHandler(IInvestigationRepository investigations)
        => _investigations = investigations;

    public async Task<InvestigationWorkspaceDto> Handle(
        GetInvestigationQuery request, CancellationToken cancellationToken)
    {
        var inv = await _investigations.FindByIncidentIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"No investigation found for incident {request.IncidentId}.");

        return new InvestigationWorkspaceDto(
            inv.Id,
            inv.IncidentId,
            inv.Incident?.IncidentReference ?? string.Empty,
            inv.Incident?.ShortDescription ?? string.Empty,
            inv.Owner,
            inv.InvestigationDate,
            inv.TargetCompletionDate,
            inv.RiskLevel?.ToString(),
            inv.Notes,
            inv.FindingsSummary,
            inv.ImmediateActionTaken,
            inv.LessonsLearned,
            inv.RootCauseCode,
            inv.RootCauseDescription,
            inv.InvestigationStatus,
            inv.InvestigationCompletedAt,
            inv.OpenedAt,
            inv.UpdatedAt,
            inv.ChecklistItems
                .OrderBy(c => c.SortOrder)
                .Select(c => new ChecklistItemDto(c.Id, c.SortOrder, c.Label, c.IsCompleted, c.CompletedAt))
                .ToList(),
            inv.TimelineEvents
                .OrderBy(t => t.OccurredAt)
                .Select(t => new TimelineEventDto(t.Id, t.EventType, t.Description, t.OccurredAt))
                .ToList()
        );
    }
}
