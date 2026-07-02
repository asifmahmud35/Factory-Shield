using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Governance.Models;
using MediatR;

namespace FactoryShield.Application.Governance.Queries;

public record GetExecutiveDashboardQuery(DateTime? From = null, DateTime? To = null) : IRequest<ExecutiveDashboardDto>;

public class GetExecutiveDashboardQueryHandler : IRequestHandler<GetExecutiveDashboardQuery, ExecutiveDashboardDto>
{
    private readonly IDashboardRepository _dashboard;

    public GetExecutiveDashboardQueryHandler(IDashboardRepository dashboard) => _dashboard = dashboard;

    public Task<ExecutiveDashboardDto> Handle(GetExecutiveDashboardQuery request, CancellationToken ct)
    {
        var from = request.From ?? DateTime.UtcNow.AddDays(-30);
        var to   = request.To   ?? DateTime.UtcNow;
        return _dashboard.GetExecutiveDashboardAsync(from, to, ct);
    }
}
