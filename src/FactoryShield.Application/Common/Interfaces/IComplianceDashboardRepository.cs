using FactoryShield.Application.Compliance.Models;

namespace FactoryShield.Application.Common.Interfaces;

public interface IComplianceDashboardRepository
{
    Task<ComplianceDashboardDto> GetDashboardAsync(DateTime from, DateTime to, Guid currentUserId, CancellationToken ct);
}
