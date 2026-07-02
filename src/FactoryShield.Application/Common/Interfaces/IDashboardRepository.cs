using FactoryShield.Application.Governance.Models;

namespace FactoryShield.Application.Common.Interfaces;

public interface IDashboardRepository
{
    Task<ExecutiveDashboardDto> GetExecutiveDashboardAsync(DateTime from, DateTime to, CancellationToken ct);
}
