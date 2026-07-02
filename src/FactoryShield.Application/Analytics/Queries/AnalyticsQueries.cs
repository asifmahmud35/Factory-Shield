using FactoryShield.Application.Analytics.Models;
using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Analytics.Queries;

public record GetAnalyticsKpiQuery(string Period) : IRequest<AnalyticsKpiDto>;

public class GetAnalyticsKpiQueryHandler : IRequestHandler<GetAnalyticsKpiQuery, AnalyticsKpiDto>
{
    private readonly IAnalyticsRepository _repo;

    public GetAnalyticsKpiQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<AnalyticsKpiDto> Handle(GetAnalyticsKpiQuery request, CancellationToken cancellationToken)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        var span = to - from;
        return _repo.GetKpiAsync(from, to, from - span, from, cancellationToken);
    }
}

public record GetIncidentTrendQuery(string Period) : IRequest<IReadOnlyList<IncidentTrendPointDto>>;

public class GetIncidentTrendQueryHandler : IRequestHandler<GetIncidentTrendQuery, IReadOnlyList<IncidentTrendPointDto>>
{
    private readonly IAnalyticsRepository _repo;

    public GetIncidentTrendQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<IReadOnlyList<IncidentTrendPointDto>> Handle(GetIncidentTrendQuery request, CancellationToken cancellationToken)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        return _repo.GetIncidentTrendAsync(from, to, cancellationToken);
    }
}

public record GetDepartmentPerformanceQuery(string Period) : IRequest<IReadOnlyList<DepartmentPerformanceDto>>;

public class GetDepartmentPerformanceQueryHandler : IRequestHandler<GetDepartmentPerformanceQuery, IReadOnlyList<DepartmentPerformanceDto>>
{
    private readonly IAnalyticsRepository _repo;

    public GetDepartmentPerformanceQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<IReadOnlyList<DepartmentPerformanceDto>> Handle(GetDepartmentPerformanceQuery request, CancellationToken cancellationToken)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        return _repo.GetDepartmentPerformanceAsync(from, to, cancellationToken);
    }
}

public record GetSeverityDistributionQuery(string Period) : IRequest<SeverityDistributionDto>;

public class GetSeverityDistributionQueryHandler : IRequestHandler<GetSeverityDistributionQuery, SeverityDistributionDto>
{
    private readonly IAnalyticsRepository _repo;

    public GetSeverityDistributionQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<SeverityDistributionDto> Handle(GetSeverityDistributionQuery request, CancellationToken cancellationToken)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        return _repo.GetSeverityDistributionAsync(from, to, cancellationToken);
    }
}

public record GetRecurringIssuesQuery(string Period) : IRequest<IReadOnlyList<RecurringIssueDto>>;

public class GetRecurringIssuesQueryHandler : IRequestHandler<GetRecurringIssuesQuery, IReadOnlyList<RecurringIssueDto>>
{
    private readonly IAnalyticsRepository _repo;

    public GetRecurringIssuesQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<IReadOnlyList<RecurringIssueDto>> Handle(GetRecurringIssuesQuery request, CancellationToken cancellationToken)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        return _repo.GetRecurringIssuesAsync(from, to, cancellationToken);
    }
}

public record GetAnalyticsExportQuery(string Period, string Format) : IRequest<AnalyticsExportDataDto>;

public class GetAnalyticsExportQueryHandler : IRequestHandler<GetAnalyticsExportQuery, AnalyticsExportDataDto>
{
    private readonly IAnalyticsRepository _repo;

    public GetAnalyticsExportQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<AnalyticsExportDataDto> Handle(GetAnalyticsExportQuery request, CancellationToken cancellationToken)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        return _repo.GetExportDataAsync(from, to, cancellationToken);
    }
}

public record GetRootCauseDistributionQuery(string Period) : IRequest<IReadOnlyList<RootCauseDistributionItemDto>>;

public class GetRootCauseDistributionQueryHandler
    : IRequestHandler<GetRootCauseDistributionQuery, IReadOnlyList<RootCauseDistributionItemDto>>
{
    private readonly IAnalyticsRepository _repo;

    public GetRootCauseDistributionQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<IReadOnlyList<RootCauseDistributionItemDto>> Handle(
        GetRootCauseDistributionQuery request, CancellationToken ct)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        return _repo.GetRootCauseDistributionAsync(from, to, ct);
    }
}

public record GetClosureRateQuery(string Period) : IRequest<IReadOnlyList<ClosureRatePointDto>>;

public class GetClosureRateQueryHandler
    : IRequestHandler<GetClosureRateQuery, IReadOnlyList<ClosureRatePointDto>>
{
    private readonly IAnalyticsRepository _repo;

    public GetClosureRateQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<IReadOnlyList<ClosureRatePointDto>> Handle(
        GetClosureRateQuery request, CancellationToken ct)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        return _repo.GetClosureRateAsync(from, to, ct);
    }
}

public record GetResolutionTimeBreakdownQuery(string Period) : IRequest<ResolutionTimeBreakdownDto>;

public class GetResolutionTimeBreakdownQueryHandler
    : IRequestHandler<GetResolutionTimeBreakdownQuery, ResolutionTimeBreakdownDto>
{
    private readonly IAnalyticsRepository _repo;

    public GetResolutionTimeBreakdownQueryHandler(IAnalyticsRepository repo) => _repo = repo;

    public Task<ResolutionTimeBreakdownDto> Handle(
        GetResolutionTimeBreakdownQuery request, CancellationToken ct)
    {
        var (from, to) = AnalyticsPeriod.Parse(request.Period);
        return _repo.GetResolutionTimeBreakdownAsync(from, to, ct);
    }
}

internal static class AnalyticsPeriod
{
    public static (DateTime From, DateTime To) Parse(string period)
    {
        var to = DateTime.UtcNow;
        var months = period?.ToLowerInvariant() switch
        {
            "1m" => 1,
            "3m" => 3,
            "12m" => 12,
            _ => 6
        };
        return (to.AddMonths(-months), to);
    }
}
