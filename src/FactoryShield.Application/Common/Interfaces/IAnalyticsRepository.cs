using FactoryShield.Application.Analytics.Models;
using FactoryShield.Application.Governance.Models;

namespace FactoryShield.Application.Common.Interfaces;

public interface IAnalyticsRepository
{
    Task<AnalyticsKpiDto> GetKpiAsync(DateTime from, DateTime to, DateTime previousFrom, DateTime previousTo, CancellationToken ct = default);
    Task<IReadOnlyList<IncidentTrendPointDto>> GetIncidentTrendAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<DepartmentPerformanceDto>> GetDepartmentPerformanceAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<SeverityDistributionDto> GetSeverityDistributionAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<RecurringIssueDto>> GetRecurringIssuesAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<AnalyticsExportDataDto> GetExportDataAsync(DateTime from, DateTime to, CancellationToken ct = default);

    Task<IReadOnlyList<RootCauseDistributionItemDto>> GetRootCauseDistributionAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<ClosureRatePointDto>> GetClosureRateAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<ResolutionTimeBreakdownDto> GetResolutionTimeBreakdownAsync(DateTime from, DateTime to, CancellationToken ct = default);
}
