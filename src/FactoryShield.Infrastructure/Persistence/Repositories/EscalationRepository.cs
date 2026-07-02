using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class EscalationRepository : IEscalationRepository
{
    private readonly AppDbContext _db;

    public EscalationRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(Escalation escalation, CancellationToken ct = default) =>
        await _db.Escalations.AddAsync(escalation, ct);

    public async Task<Escalation?> FindByIdAsync(Guid escalationId, CancellationToken ct = default) =>
        await _db.Escalations.FindAsync([escalationId], ct);

    public async Task<IReadOnlyList<Escalation>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct = default) =>
        await _db.Escalations
            .Where(e => e.IncidentId == incidentId)
            .OrderByDescending(e => e.EscalatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Escalation>> GetActiveAsync(CancellationToken ct = default) =>
        await _db.Escalations
            .Include(e => e.Incident)
            .Include(e => e.EscalatedTo)
            .Where(e => e.Resolution == "OPEN" || e.Resolution == "ACKNOWLEDGED")
            .OrderByDescending(e => e.EscalatedAt)
            .ToListAsync(ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
