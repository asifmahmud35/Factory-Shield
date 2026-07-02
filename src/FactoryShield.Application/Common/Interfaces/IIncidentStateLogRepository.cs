using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IIncidentStateLogRepository
{
    Task<List<IncidentStateLog>> GetByIncidentIdFilteredAsync(
        Guid incidentId,
        string[] allowedScopes,
        CancellationToken ct);
}
