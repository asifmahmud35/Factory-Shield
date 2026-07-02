using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class ApprovalEventRepository : IApprovalEventRepository
{
    private readonly AppDbContext _db;

    public ApprovalEventRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(ApprovalEvent ev, CancellationToken ct) =>
        await _db.ApprovalEvents.AddAsync(ev, ct);

    public Task<List<ApprovalEvent>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct) =>
        _db.ApprovalEvents
           .Include(e => e.Actor).ThenInclude(u => u.Role)
           .Where(e => e.IncidentId == incidentId)
           .OrderBy(e => e.SubmittedAt)
           .ToListAsync(ct);

    public Task<List<ApprovalEvent>> GetByIncidentAndTypeAsync(
        Guid incidentId, ApprovalType type, CancellationToken ct) =>
        _db.ApprovalEvents
           .Include(e => e.Actor).ThenInclude(u => u.Role)
           .Where(e => e.IncidentId == incidentId && e.ApprovalType == type)
           .ToListAsync(ct);

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
