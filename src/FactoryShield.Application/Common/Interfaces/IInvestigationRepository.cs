using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IInvestigationRepository
{
    Task<Investigation?> FindByIncidentIdAsync(Guid incidentId, CancellationToken ct = default);
    Task<InvestigationChecklistItem?> FindChecklistItemAsync(Guid itemId, CancellationToken ct = default);
    Task AddAsync(Investigation investigation, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
