using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Compliance.Models;
using MediatR;

namespace FactoryShield.Application.Compliance.Queries;

public record GetComplianceDashboardQuery(DateTime From, DateTime To, Guid CurrentUserId)
    : IRequest<ComplianceDashboardDto>;

public class GetComplianceDashboardQueryHandler
    : IRequestHandler<GetComplianceDashboardQuery, ComplianceDashboardDto>
{
    private readonly IComplianceDashboardRepository _repo;

    public GetComplianceDashboardQueryHandler(IComplianceDashboardRepository repo)
        => _repo = repo;

    public Task<ComplianceDashboardDto> Handle(
        GetComplianceDashboardQuery request, CancellationToken ct)
        => _repo.GetDashboardAsync(request.From, request.To, request.CurrentUserId, ct);
}
