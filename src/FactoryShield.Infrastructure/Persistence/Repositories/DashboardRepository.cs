using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Governance.Models;
using FactoryShield.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly AppDbContext _db;

    public DashboardRepository(AppDbContext db) => _db = db;

    private static readonly IncidentStatus[] OpenStatuses =
    [
        IncidentStatus.Submitted,
        IncidentStatus.Triaged,
        IncidentStatus.Assigned,
        IncidentStatus.InProgress,
        IncidentStatus.PendingEvidence,
        IncidentStatus.PendingReporterInput,
        IncidentStatus.Investigation,
        IncidentStatus.RcaReview,
        IncidentStatus.CapaExecution,
        IncidentStatus.Verification,
    ];

    private static readonly string[] SevLabels = ["", "Critical", "High", "Medium", "Low"];

    public async Task<ExecutiveDashboardDto> GetExecutiveDashboardAsync(
        DateTime from, DateTime to, CancellationToken ct)
    {
        var incidents = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
            .ToListAsync(ct);

        var ids = incidents.Select(i => i.Id).ToList();

        var totalOpen     = incidents.Count(i => OpenStatuses.Contains(i.Status));
        var totalResolved = incidents.Count(i => i.Status == IncidentStatus.Resolved);
        var totalClosed   = incidents.Count(i => i.Status == IncidentStatus.Closed);

        var bySeverity = incidents
            .GroupBy(i => i.Severity)
            .OrderBy(g => g.Key)
            .Select(g => new CountBySeverity(
                g.Key,
                g.Key >= 1 && g.Key <= 4 ? SevLabels[g.Key] : "Unknown",
                g.Count()))
            .ToList();

        var byStatus = incidents
            .GroupBy(i => i.Status.ToString())
            .OrderByDescending(g => g.Count())
            .Select(g => new CountByStatus(g.Key, g.Count()))
            .ToList();

        var byDepartment = incidents
            .Where(i => !string.IsNullOrWhiteSpace(i.Department))
            .GroupBy(i => i.Department!)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => new CountByDepartment(g.Key, g.Count()))
            .ToList();

        // SLA breach: clocks where elapsed > TargetMinutes (account for pause time)
        var clocks = await _db.SlaClocks
            .Where(s => ids.Contains(s.IncidentId) && s.StartedAt >= from)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        var slaBreachCount = clocks.Count(s =>
        {
            var end = s.StoppedAt ?? now;
            var elapsedMinutes = (end - s.StartedAt).TotalMinutes - s.AccumulatedPauseMinutes;
            return elapsedMinutes > s.TargetMinutes;
        });

        var completedClocks = clocks.Where(s => s.StoppedAt.HasValue).ToList();
        var avgResolutionMinutes = completedClocks.Count == 0
            ? 0.0
            : completedClocks.Average(s =>
                (s.StoppedAt!.Value - s.StartedAt).TotalMinutes - s.AccumulatedPauseMinutes);

        // CAPA completion rate
        var capas = await _db.CorrectiveActions
            .Where(c => ids.Contains(c.IncidentId))
            .ToListAsync(ct);

        var capaCompletionRate = capas.Count == 0
            ? 0.0
            : (double)capas.Count(c => c.CompletionPercentage >= 100) / capas.Count * 100.0;

        return new ExecutiveDashboardDto(
            TotalOpen:            totalOpen,
            TotalResolved:        totalResolved,
            TotalClosed:          totalClosed,
            BySeverity:           bySeverity,
            ByStatus:             byStatus,
            ByDepartment:         byDepartment,
            AvgResolutionMinutes: Math.Round(avgResolutionMinutes, 1),
            SlaBreachCount:       slaBreachCount,
            CapaCompletionRate:   Math.Round(capaCompletionRate, 1)
        );
    }
}
