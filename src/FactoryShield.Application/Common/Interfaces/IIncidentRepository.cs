using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;

namespace FactoryShield.Application.Common.Interfaces;

public interface IIncidentRepository
{
    Task<int> CountByYearAsync(int year, CancellationToken ct = default);
    Task<Incident?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<Incident?> FindByReferenceAsync(string incidentReference, CancellationToken ct = default);
    Task<IReadOnlyList<Incident>> GetByReporterAsync(Guid reporterId, CancellationToken ct = default);

    /// <summary>Every incident regardless of reporter — for the org-wide "All Incidents" view (non-Reporter roles). Eager-loads Reporter + AssignedResolver.</summary>
    Task<IReadOnlyList<Incident>> GetAllAsync(CancellationToken ct = default);

    /// <summary>Sorted by severity ascending (1=CRITICAL first) then CreatedAt ascending (oldest first).</summary>
    Task<IReadOnlyList<Incident>> GetByStatusAsync(IncidentStatus status, CancellationToken ct = default);

    /// <summary>Same ordering, but matches any of the given statuses.</summary>
    Task<IReadOnlyList<Incident>> GetByStatusesAsync(IReadOnlyCollection<IncidentStatus> statuses, CancellationToken ct = default);

    /// <summary>Same as <see cref="GetByStatusesAsync"/> but eager-loads the Reporter (for the Approvals page).</summary>
    Task<IReadOnlyList<Incident>> GetByStatusesWithReporterAsync(IReadOnlyCollection<IncidentStatus> statuses, CancellationToken ct = default);

    /// <summary>Load a single incident by Id; throws KeyNotFoundException if missing.</summary>
    Task<Incident?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Incidents assigned to a specific resolver, excluding terminal states (Closed, Rejected).</summary>
    Task<IReadOnlyList<Incident>> GetByResolverAsync(Guid resolverId, CancellationToken ct = default);
    Task AddAsync(Incident incident, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
