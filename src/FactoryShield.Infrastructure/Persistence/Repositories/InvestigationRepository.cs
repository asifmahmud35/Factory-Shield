using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class InvestigationRepository : IInvestigationRepository
{
    private readonly AppDbContext _db;

    public InvestigationRepository(AppDbContext db) => _db = db;

    public Task<Investigation?> FindByIncidentIdAsync(Guid incidentId, CancellationToken ct = default) =>
        _db.Investigations
            .Include(i => i.Incident)
            .Include(i => i.ChecklistItems)
            .Include(i => i.TimelineEvents)
            .FirstOrDefaultAsync(i => i.IncidentId == incidentId, ct);

    public Task<InvestigationChecklistItem?> FindChecklistItemAsync(Guid itemId, CancellationToken ct = default) =>
        _db.InvestigationChecklistItems.FirstOrDefaultAsync(c => c.Id == itemId, ct);

    public async Task AddAsync(Investigation investigation, CancellationToken ct = default) =>
        await _db.Investigations.AddAsync(investigation, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
