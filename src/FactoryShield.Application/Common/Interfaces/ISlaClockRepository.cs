using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface ISlaClockRepository
{
    Task AddAsync(SlaClock clock, CancellationToken ct = default);

    /// <summary>The running clock (StoppedAt == null) for an incident, or null if none is active.</summary>
    Task<SlaClock?> GetActiveByIncidentIdAsync(Guid incidentId, CancellationToken ct = default);

    /// <summary>Running clocks for a set of incidents — used to decorate list views without N+1 queries.</summary>
    Task<IReadOnlyList<SlaClock>> GetActiveByIncidentIdsAsync(
        IReadOnlyCollection<Guid> incidentIds, CancellationToken ct = default);

    /// <summary>All open clocks (StoppedAt == null) — used by SlaCheckJob.</summary>
    Task<IReadOnlyList<SlaClock>> GetAllOpenAsync(CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}
