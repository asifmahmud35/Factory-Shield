namespace FactoryShield.Application.Analytics.Models;

public record AnalyticsKpiDto(
    string Period,
    int TotalIncidents,
    double TotalIncidentsTrend,
    double AvgResolutionHours,
    double AvgResolutionTrend,
    double SlaCompliancePct,
    double SlaComplianceTrend,
    double RecurringRatePct,
    double RecurringRateTrend
);

public record IncidentTrendPointDto(string Month, int Reported);

public record DepartmentPerformanceDto(string Dept, int Incidents, int Resolved);

public record SeverityDistributionDto(int Low, int Medium, int High, int Critical);

public record RecurringIssueDto(int Rank, string Title, string Department, int Count, int Trend);

public record AnalyticsExportDataDto(
    AnalyticsKpiDto Kpi,
    IReadOnlyList<IncidentTrendPointDto> Trend,
    IReadOnlyList<DepartmentPerformanceDto> Departments,
    SeverityDistributionDto Severity,
    IReadOnlyList<RecurringIssueDto> Recurring
);

// ── New: Root Cause Distribution (GET /analytics/root-cause-distribution) ─────
public record RootCauseDistributionItemDto(
    string Category,
    int Count,
    double Pct
);

// ── New: Closure Rate (GET /analytics/closure-rate) ───────────────────────────
public record ClosureRatePointDto(
    string Month,
    int Reported,
    int Closed,
    double ClosureRatePct
);

// ── New: Resolution Time Breakdown (GET /analytics/resolution-time) ───────────
public record ResolutionTimeByGroupDto(string Group, double AvgHours, int Count);

public record ResolutionTimeBreakdownDto(
    double OverallAvgHours,
    IReadOnlyList<ResolutionTimeByGroupDto> ByDepartment,
    IReadOnlyList<ResolutionTimeByGroupDto> BySeverity,
    IReadOnlyList<ResolutionTimeByGroupDto> ByCategory
);
