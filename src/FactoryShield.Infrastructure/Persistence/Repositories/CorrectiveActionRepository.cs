using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class CorrectiveActionRepository : ICorrectiveActionRepository
{
    private readonly AppDbContext _db;

    public CorrectiveActionRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<CorrectiveAction>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct = default) =>
        await _db.CorrectiveActions
            .Where(c => c.IncidentId == incidentId)
            .OrderBy(c => c.Priority)
            .ThenBy(c => c.CreatedAt)
            .ToListAsync(ct);

    public Task<CorrectiveAction?> FindByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.CorrectiveActions.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(CorrectiveAction action, CancellationToken ct = default) =>
        await _db.CorrectiveActions.AddAsync(action, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
