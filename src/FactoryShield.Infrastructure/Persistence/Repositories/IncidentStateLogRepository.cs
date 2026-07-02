using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class IncidentStateLogRepository : IIncidentStateLogRepository
{
    private readonly AppDbContext _db;

    public IncidentStateLogRepository(AppDbContext db) => _db = db;

    public Task<List<IncidentStateLog>> GetByIncidentIdFilteredAsync(
        Guid incidentId,
        string[] allowedScopes,
        CancellationToken ct)
    {
        return _db.IncidentStateLogs
            .Where(l => l.IncidentId == incidentId && allowedScopes.Contains(l.VisibilityScope))
            .Include(l => l.Actor)
            .OrderBy(l => l.CreatedAt)
            .ToListAsync(ct);
    }
}
