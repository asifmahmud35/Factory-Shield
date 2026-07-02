using FactoryShield.Application.Analytics.Models;
using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class AnalyticsRepository : IAnalyticsRepository
{
    private readonly AppDbContext _db;

    public AnalyticsRepository(AppDbContext db) => _db = db;

    public async Task<AnalyticsKpiDto> GetKpiAsync(
        DateTime from, DateTime to, DateTime previousFrom, DateTime previousTo, CancellationToken ct = default)
    {
        var current = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
            .ToListAsync(ct);

        var previous = await _db.Incidents
            .Where(i => i.CreatedAt >= previousFrom && i.CreatedAt <= previousTo)
            .ToListAsync(ct);

        var currentIds = current.Select(i => i.Id).ToList();
        var previousIds = previous.Select(i => i.Id).ToList();

        var currentClocks = await _db.SlaClocks
            .Where(s => currentIds.Contains(s.IncidentId))
            .ToListAsync(ct);
        var previousClocks = await _db.SlaClocks
            .Where(s => previousIds.Contains(s.IncidentId))
            .ToListAsync(ct);

        var currentSla = SlaCompliancePct(currentClocks);
        var previousSla = SlaCompliancePct(previousClocks);

        var currentAvgHours = await AvgResolutionHoursAsync(currentIds, ct);
        var previousAvgHours = await AvgResolutionHoursAsync(previousIds, ct);

        var currentRecurring = RecurringRatePct(current);
        var previousRecurring = RecurringRatePct(previous);

        var totalTrend = TrendPct(current.Count, previous.Count);
        var periodLabel = FormatPeriod(from, to);

        return new AnalyticsKpiDto(
            periodLabel,
            current.Count,
            totalTrend,
            currentAvgHours,
            currentAvgHours - previousAvgHours,
            currentSla,
            currentSla - previousSla,
            currentRecurring,
            currentRecurring - previousRecurring
        );
    }

    public async Task<IReadOnlyList<IncidentTrendPointDto>> GetIncidentTrendAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        var incidents = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
            .Select(i => i.CreatedAt)
            .ToListAsync(ct);

        return incidents
            .GroupBy(d => new { d.Year, d.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new IncidentTrendPointDto(
                new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                g.Count()))
            .ToList();
    }

    public async Task<IReadOnlyList<DepartmentPerformanceDto>> GetDepartmentPerformanceAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        var resolved = new[] { IncidentStatus.Resolved, IncidentStatus.Closed };

        // Npgsql can't translate Count(predicate) inside a grouped Select, so
        // project the columns we need and group/count client-side instead.
        var rows = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to && i.Department != null)
            .Select(i => new { i.Department, i.Status })
            .ToListAsync(ct);

        return rows
            .GroupBy(i => i.Department!)
            .Select(g => new DepartmentPerformanceDto(
                g.Key,
                g.Count(),
                g.Count(i => resolved.Contains(i.Status))))
            .OrderByDescending(d => d.Incidents)
            .ToList();
    }

    public async Task<SeverityDistributionDto> GetSeverityDistributionAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        var counts = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
            .GroupBy(i => i.Severity)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        return new SeverityDistributionDto(
            counts.FirstOrDefault(c => c.Severity == 4)?.Count ?? 0,
            counts.FirstOrDefault(c => c.Severity == 3)?.Count ?? 0,
            counts.FirstOrDefault(c => c.Severity == 2)?.Count ?? 0,
            counts.FirstOrDefault(c => c.Severity == 1)?.Count ?? 0
        );
    }

    public async Task<IReadOnlyList<RecurringIssueDto>> GetRecurringIssuesAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        var mid = from.Add((to - from) / 2);
        var firstHalf = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt < mid)
            .GroupBy(i => new { i.Category, Dept = i.Department ?? "Unknown" })
            .Select(g => new { g.Key.Category, g.Key.Dept, Count = g.Count() })
            .ToListAsync(ct);

        var secondHalf = await _db.Incidents
            .Where(i => i.CreatedAt >= mid && i.CreatedAt <= to)
            .GroupBy(i => new { i.Category, Dept = i.Department ?? "Unknown" })
            .Select(g => new { g.Key.Category, g.Key.Dept, Count = g.Count() })
            .ToListAsync(ct);

        var combined = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
            .GroupBy(i => new { i.Category, Dept = i.Department ?? "Unknown" })
            .Select(g => new { g.Key.Category, g.Key.Dept, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync(ct);

        return combined.Select((x, idx) =>
        {
            var prev = firstHalf.FirstOrDefault(f => f.Category == x.Category && f.Dept == x.Dept)?.Count ?? 0;
            var curr = secondHalf.FirstOrDefault(f => f.Category == x.Category && f.Dept == x.Dept)?.Count ?? 0;
            return new RecurringIssueDto(idx + 1, x.Category, x.Dept, x.Count, curr - prev);
        }).ToList();
    }

    public async Task<AnalyticsExportDataDto> GetExportDataAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        var span = to - from;
        var previousFrom = from - span;
        var previousTo = from;

        var kpi = await GetKpiAsync(from, to, previousFrom, previousTo, ct);
        var trend = await GetIncidentTrendAsync(from, to, ct);
        var depts = await GetDepartmentPerformanceAsync(from, to, ct);
        var severity = await GetSeverityDistributionAsync(from, to, ct);
        var recurring = await GetRecurringIssuesAsync(from, to, ct);

        return new AnalyticsExportDataDto(kpi, trend, depts, severity, recurring);
    }

    private static double SlaCompliancePct(IReadOnlyList<Domain.Entities.SlaClock> clocks)
    {
        if (clocks.Count == 0) return 100.0;
        var now = DateTime.UtcNow;
        var compliant = clocks.Count(s =>
        {
            var end = s.StoppedAt ?? now;
            var elapsed = (end - s.StartedAt).TotalMinutes - s.AccumulatedPauseMinutes;
            return elapsed <= s.TargetMinutes;
        });
        return Math.Round((double)compliant / clocks.Count * 100.0, 1);
    }

    private async Task<double> AvgResolutionHoursAsync(IReadOnlyList<Guid> incidentIds, CancellationToken ct)
    {
        if (incidentIds.Count == 0) return 0;

        var hours = await _db.IncidentStateLogs
            .Where(l => incidentIds.Contains(l.IncidentId) &&
                        (l.ToStatus == "Resolved" || l.ToStatus == "Closed"))
            .Join(_db.Incidents, l => l.IncidentId, i => i.Id, (l, i) => new { i.CreatedAt, ResolvedAt = l.CreatedAt })
            .Select(x => (x.ResolvedAt - x.CreatedAt).TotalHours)
            .ToListAsync(ct);

        return hours.Count == 0 ? 0 : Math.Round(hours.Average(), 1);
    }

    private static double RecurringRatePct(IReadOnlyList<Domain.Entities.Incident> incidents)
    {
        if (incidents.Count == 0) return 0;
        var recurring = incidents
            .GroupBy(i => i.Category)
            .Count(g => g.Count() > 1);
        return Math.Round((double)recurring / incidents.GroupBy(i => i.Category).Count() * 100.0, 1);
    }

    // ── Root Cause Distribution ───────────────────────────────────────────────
    public async Task<IReadOnlyList<RootCauseDistributionItemDto>> GetRootCauseDistributionAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        // Join investigations to incidents within the period.
        // Use StructuredCategory (fishbone category) when available, fall back to RcaMethod.
        var rows = await _db.Investigations
            .Where(inv => inv.OpenedAt >= from && inv.OpenedAt <= to)
            .Select(inv => new
            {
                Category = inv.StructuredCategory ?? inv.RcaMethod ?? "Unclassified"
            })
            .ToListAsync(ct);

        if (rows.Count == 0)
            return [];

        var groups = rows
            .GroupBy(r => r.Category)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .ToList();

        var total = groups.Sum(g => g.Count);
        return groups.Select(g => new RootCauseDistributionItemDto(
            g.Category,
            g.Count,
            Math.Round((double)g.Count / total * 100.0, 1)
        )).ToList();
    }

    // ── Closure Rate ──────────────────────────────────────────────────────────
    public async Task<IReadOnlyList<ClosureRatePointDto>> GetClosureRateAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        var allIncidents = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
            .Select(i => new { i.Id, i.CreatedAt, i.Status })
            .ToListAsync(ct);

        var closedIds = allIncidents
            .Where(i => i.Status == IncidentStatus.Closed || i.Status == IncidentStatus.Resolved)
            .Select(i => i.Id)
            .ToList();

        // Fetch the first "Resolved/Closed" state log timestamp for closed incidents.
        var closedAt = await _db.IncidentStateLogs
            .Where(l => closedIds.Contains(l.IncidentId)
                     && (l.ToStatus == "Resolved" || l.ToStatus == "Closed"))
            .GroupBy(l => l.IncidentId)
            .Select(g => new { IncidentId = g.Key, ClosedAt = g.Min(l => l.CreatedAt) })
            .ToListAsync(ct);

        var closedLookup = closedAt.ToDictionary(x => x.IncidentId, x => x.ClosedAt);

        // Build month buckets.
        var months = new List<(int Year, int Month)>();
        var cursor = new DateTime(from.Year, from.Month, 1);
        while (cursor <= to)
        {
            months.Add((cursor.Year, cursor.Month));
            cursor = cursor.AddMonths(1);
        }

        return months.Select(m =>
        {
            var mStart = new DateTime(m.Year, m.Month, 1);
            var mEnd   = mStart.AddMonths(1);

            var reported = allIncidents.Count(i => i.CreatedAt >= mStart && i.CreatedAt < mEnd);
            var closed   = closedLookup.Values.Count(d => d >= mStart && d < mEnd);
            var rate     = reported == 0 ? 0.0 : Math.Round((double)closed / reported * 100.0, 1);

            return new ClosureRatePointDto(
                mStart.ToString("MMM yyyy"),
                reported,
                closed,
                rate
            );
        }).ToList();
    }

    // ── Resolution Time Breakdown ─────────────────────────────────────────────
    public async Task<ResolutionTimeBreakdownDto> GetResolutionTimeBreakdownAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        var incidents = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
            .Select(i => new
            {
                i.Id,
                i.CreatedAt,
                i.Department,
                i.Severity,
                i.Category,
                i.Status
            })
            .ToListAsync(ct);

        var ids = incidents.Select(i => i.Id).ToList();

        var logs = await _db.IncidentStateLogs
            .Where(l => ids.Contains(l.IncidentId)
                     && (l.ToStatus == "Resolved" || l.ToStatus == "Closed"))
            .GroupBy(l => l.IncidentId)
            .Select(g => new { IncidentId = g.Key, ResolvedAt = g.Min(l => l.CreatedAt) })
            .ToListAsync(ct);

        var resolvedMap = logs.ToDictionary(x => x.IncidentId, x => x.ResolvedAt);

        var withResolution = incidents
            .Where(i => resolvedMap.ContainsKey(i.Id))
            .Select(i => new
            {
                i.Department,
                i.Severity,
                i.Category,
                HoursToResolve = (resolvedMap[i.Id] - i.CreatedAt).TotalHours
            })
            .ToList();

        if (withResolution.Count == 0)
            return new ResolutionTimeBreakdownDto(0, [], [], []);

        var overall = Math.Round(withResolution.Average(x => x.HoursToResolve), 1);

        var byDept = withResolution
            .GroupBy(x => x.Department ?? "Unknown")
            .Select(g => new ResolutionTimeByGroupDto(
                g.Key,
                Math.Round(g.Average(x => x.HoursToResolve), 1),
                g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var bySeverity = withResolution
            .GroupBy(x => x.Severity switch { 1 => "CRITICAL", 2 => "HIGH", 3 => "MEDIUM", _ => "LOW" })
            .Select(g => new ResolutionTimeByGroupDto(
                g.Key,
                Math.Round(g.Average(x => x.HoursToResolve), 1),
                g.Count()))
            .OrderBy(x => x.Group)
            .ToList();

        var byCategory = withResolution
            .GroupBy(x => x.Category)
            .Select(g => new ResolutionTimeByGroupDto(
                g.Key,
                Math.Round(g.Average(x => x.HoursToResolve), 1),
                g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();

        return new ResolutionTimeBreakdownDto(overall, byDept, bySeverity, byCategory);
    }

    private static double TrendPct(int current, int previous) =>
        previous == 0 ? (current > 0 ? 100.0 : 0.0) : Math.Round((current - previous) / (double)previous * 100.0, 1);

    private static string FormatPeriod(DateTime from, DateTime to)
    {
        var months = (int)Math.Round((to - from).TotalDays / 30.0);
        return months switch
        {
            <= 1 => "1m",
            <= 3 => "3m",
            <= 6 => "6m",
            _ => "12m"
        };
    }
}
