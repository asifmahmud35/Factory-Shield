using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface ICorrectiveActionRepository
{
    Task<IReadOnlyList<CorrectiveAction>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct = default);
    Task<CorrectiveAction?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(CorrectiveAction action, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
