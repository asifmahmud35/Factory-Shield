using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class AttachmentRepository : IAttachmentRepository
{
    private readonly AppDbContext _db;

    public AttachmentRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Attachment>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct = default) =>
        await _db.Attachments
            .Include(a => a.Uploader)
            .Where(a => a.IncidentId == incidentId)
            .OrderByDescending(a => a.UploadedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Attachment attachment, CancellationToken ct = default) =>
        await _db.Attachments.AddAsync(attachment, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
