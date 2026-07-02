using FactoryShield.Application.Approver.Models;
using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Approver.Queries;

public record GetActiveEscalationsQuery : IRequest<IReadOnlyList<ActiveEscalationDto>>;

public class GetActiveEscalationsQueryHandler : IRequestHandler<GetActiveEscalationsQuery, IReadOnlyList<ActiveEscalationDto>>
{
    private static readonly string[] SevLabels = ["", "Critical", "High", "Medium", "Low"];

    private readonly IEscalationRepository _escalations;
    private readonly ISlaClockRepository _slaClocks;
    private readonly ICorrectiveActionRepository _actions;

    public GetActiveEscalationsQueryHandler(
        IEscalationRepository escalations,
        ISlaClockRepository slaClocks,
        ICorrectiveActionRepository actions)
    {
        _escalations = escalations;
        _slaClocks = slaClocks;
        _actions = actions;
    }

    public async Task<IReadOnlyList<ActiveEscalationDto>> Handle(
        GetActiveEscalationsQuery request, CancellationToken cancellationToken)
    {
        var active = await _escalations.GetActiveAsync(cancellationToken);
        if (active.Count == 0)
            return [];

        var incidentIds = active.Select(e => e.IncidentId).Distinct().ToList();

        var clocks = await _slaClocks.GetActiveByIncidentIdsAsync(incidentIds, cancellationToken);
        var clockByIncident = clocks.ToDictionary(c => c.IncidentId);

        var progressByIncident = new Dictionary<Guid, int>();
        foreach (var incidentId in incidentIds)
        {
            var capas = await _actions.GetByIncidentIdAsync(incidentId, cancellationToken);
            progressByIncident[incidentId] = capas.Count == 0
                ? 0
                : (int)Math.Round(capas.Average(a => a.CompletionPercentage));
        }

        var now = DateTime.UtcNow;

        return active.Select(e =>
        {
            clockByIncident.TryGetValue(e.IncidentId, out var clock);
            var (remaining, overdue) = ComputeSla(clock, now);

            var incident = e.Incident;
            var severityLabel = incident.Severity is >= 1 and <= 4
                ? SevLabels[incident.Severity]
                : "Unknown";

            var day = Math.Max(1, (int)Math.Floor((now - e.EscalatedAt).TotalDays) + 1);

            return new ActiveEscalationDto(
                e.Id,
                e.IncidentId,
                incident.IncidentReference,
                severityLabel,
                incident.ShortDescription,
                FormatEscalatedTo(e),
                day,
                progressByIncident.GetValueOrDefault(e.IncidentId),
                remaining,
                overdue
            );
        }).ToList();
    }

    private static (int RemainingMinutes, bool Overdue) ComputeSla(Domain.Entities.SlaClock? clock, DateTime now)
    {
        if (clock is null)
            return (0, false);

        var elapsed = (now - clock.StartedAt).TotalMinutes - clock.AccumulatedPauseMinutes;
        var remaining = (int)Math.Round(clock.TargetMinutes - elapsed);
        var overdue = remaining < 0;
        return (Math.Max(0, remaining), overdue);
    }

    private static string FormatEscalatedTo(Domain.Entities.Escalation escalation)
    {
        if (escalation.EscalatedTo?.Name is { Length: > 0 } name)
            return $"Level {escalation.Level} — {name}";

        var role = escalation.Level switch
        {
            1 => "Supervisor",
            2 => "Factory Manager",
            _ => "Plant Manager"
        };
        return $"Level {escalation.Level} — {role}";
    }
}
