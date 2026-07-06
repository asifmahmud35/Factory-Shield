using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;

namespace FactoryShield.Application.Common.Interfaces;

public interface IApprovalEventRepository
{
    Task AddAsync(ApprovalEvent ev, CancellationToken ct);
    Task<List<ApprovalEvent>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct);
    Task<List<ApprovalEvent>> GetByIncidentAndTypeAsync(Guid incidentId, ApprovalType type, CancellationToken ct);
    Task<List<ApprovalEvent>> GetByIncidentIdsAsync(IReadOnlyCollection<Guid> incidentIds, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}
