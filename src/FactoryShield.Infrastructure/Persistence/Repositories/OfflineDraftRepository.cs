using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class OfflineDraftRepository : IOfflineDraftRepository
{
    private readonly AppDbContext _db;

    public OfflineDraftRepository(AppDbContext db) => _db = db;

    public Task<OfflineDraft?> FindByHashAsync(Guid reporterId, string payloadHash, CancellationToken ct) =>
        _db.OfflineDrafts
           .FirstOrDefaultAsync(d => d.ReporterId == reporterId && d.PayloadHash == payloadHash, ct);

    public Task<OfflineDraft?> FindByLocalDraftIdAsync(Guid reporterId, string localDraftId, CancellationToken ct) =>
        _db.OfflineDrafts
           .FirstOrDefaultAsync(d => d.ReporterId == reporterId && d.LocalDraftId == localDraftId, ct);

    public Task<List<OfflineDraft>> GetByReporterIdAsync(Guid reporterId, CancellationToken ct) =>
        _db.OfflineDrafts
           .Where(d => d.ReporterId == reporterId)
           .OrderByDescending(d => d.LocalEventTime)
           .ToListAsync(ct);

    public async Task AddAsync(OfflineDraft draft, CancellationToken ct) =>
        await _db.OfflineDrafts.AddAsync(draft, ct);

    public Task<List<OfflineDraft>> GetStaleDraftsAsync(DateTime olderThan, CancellationToken ct) =>
        _db.OfflineDrafts
           .Where(d => olderThan == DateTime.MinValue || d.LocalEventTime < olderThan)
           .ToListAsync(ct);

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
