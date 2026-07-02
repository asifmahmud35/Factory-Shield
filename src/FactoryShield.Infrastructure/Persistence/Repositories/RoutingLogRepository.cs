using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class RoutingLogRepository : IRoutingLogRepository
{
    private readonly AppDbContext _db;

    public RoutingLogRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(IncidentRoutingLog log, CancellationToken ct = default) =>
        await _db.IncidentRoutingLogs.AddAsync(log, ct);

    public Task<List<IncidentRoutingLog>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct = default) =>
        _db.IncidentRoutingLogs
           .Include(r => r.ChangedBy).ThenInclude(u => u.Role)
           .Where(r => r.IncidentId == incidentId)
           .OrderBy(r => r.ChangedAt)
           .ToListAsync(ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
