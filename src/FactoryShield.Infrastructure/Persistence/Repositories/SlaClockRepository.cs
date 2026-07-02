using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class SlaClockRepository : ISlaClockRepository
{
    private readonly AppDbContext _db;

    public SlaClockRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(SlaClock clock, CancellationToken ct = default) =>
        await _db.SlaClocks.AddAsync(clock, ct);

    public Task<SlaClock?> GetActiveByIncidentIdAsync(Guid incidentId, CancellationToken ct = default) =>
        _db.SlaClocks
            .Where(c => c.IncidentId == incidentId && c.StoppedAt == null)
            .OrderByDescending(c => c.StartedAt)
            .FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<SlaClock>> GetActiveByIncidentIdsAsync(
        IReadOnlyCollection<Guid> incidentIds, CancellationToken ct = default)
    {
        if (incidentIds.Count == 0)
            return [];

        return await _db.SlaClocks
            .Where(c => incidentIds.Contains(c.IncidentId) && c.StoppedAt == null)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<SlaClock>> GetAllOpenAsync(CancellationToken ct = default) =>
        await _db.SlaClocks
            .Where(c => c.StoppedAt == null)
            .ToListAsync(ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
