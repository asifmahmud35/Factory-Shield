using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class IncidentClaimRepository : IIncidentClaimRepository
{
    private readonly AppDbContext _db;

    public IncidentClaimRepository(AppDbContext db) => _db = db;

    public Task<IncidentClaim?> GetActiveByIncidentIdAsync(Guid incidentId, CancellationToken ct = default) =>
        _db.IncidentClaims
           .Include(c => c.ClaimedBy)
           .FirstOrDefaultAsync(c => c.IncidentId == incidentId && c.IsActive, ct);

    public async Task<IReadOnlyList<IncidentClaim>> GetActiveByIncidentIdsAsync(
        IReadOnlyCollection<Guid> incidentIds, CancellationToken ct = default) =>
        await _db.IncidentClaims
            .Include(c => c.ClaimedBy)
            .Where(c => incidentIds.Contains(c.IncidentId) && c.IsActive)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<IncidentClaim>> GetExpiredClaimsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return await _db.IncidentClaims
            .Where(c => c.IsActive && c.ExpiresAt <= now)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<IncidentClaim>> GetAllByIncidentIdAsync(
        Guid incidentId, CancellationToken ct = default) =>
        await _db.IncidentClaims
            .Include(c => c.ClaimedBy).ThenInclude(u => u.Role)
            .Where(c => c.IncidentId == incidentId)
            .OrderBy(c => c.ClaimedAt)
            .ToListAsync(ct);

    public async Task AddAsync(IncidentClaim claim, CancellationToken ct = default) =>
        await _db.IncidentClaims.AddAsync(claim, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
