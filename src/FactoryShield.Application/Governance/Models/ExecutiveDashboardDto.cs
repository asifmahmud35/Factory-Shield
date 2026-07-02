namespace FactoryShield.Application.Governance.Models;

public record ExecutiveDashboardDto(
    int TotalOpen,
    int TotalResolved,
    int TotalClosed,
    IReadOnlyList<CountBySeverity> BySeverity,
    IReadOnlyList<CountByStatus> ByStatus,
    IReadOnlyList<CountByDepartment> ByDepartment,
    double AvgResolutionMinutes,
    int SlaBreachCount,
    double CapaCompletionRate
);

public record CountBySeverity(int Severity, string Label, int Count);
public record CountByStatus(string Status, int Count);
public record CountByDepartment(string Department, int Count);
