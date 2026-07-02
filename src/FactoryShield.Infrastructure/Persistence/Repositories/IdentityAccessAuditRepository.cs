using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class IdentityAccessAuditRepository : IIdentityAccessAuditRepository
{
    private readonly AppDbContext _db;

    public IdentityAccessAuditRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(IdentityAccessAudit audit, CancellationToken ct) =>
        await _db.IdentityAccessAudits.AddAsync(audit, ct);

    public Task<List<IdentityAccessAudit>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct) =>
        _db.IdentityAccessAudits
           .Where(a => a.IncidentId == incidentId)
           .OrderByDescending(a => a.AccessedAt)
           .ToListAsync(ct);

    public Task<List<IdentityAccessAudit>> GetFilteredAsync(
        DateTime? from, DateTime? to, Guid? actorId, Guid excludeUserId, CancellationToken ct)
    {
        var q = _db.IdentityAccessAudits
            .Include(a => a.AccessedBy).ThenInclude(u => u.Role)
            .Include(a => a.Incident)
            .Where(a => a.AccessedById != excludeUserId);

        if (from.HasValue)   q = q.Where(a => a.AccessedAt >= from.Value);
        if (to.HasValue)     q = q.Where(a => a.AccessedAt <= to.Value);
        if (actorId.HasValue) q = q.Where(a => a.AccessedById == actorId.Value);

        return q.OrderByDescending(a => a.AccessedAt).Take(500).ToListAsync(ct);
    }

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
