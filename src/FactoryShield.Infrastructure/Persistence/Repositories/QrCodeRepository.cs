using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class QrCodeRepository : IQrCodeRepository
{
    private readonly AppDbContext _db;

    public QrCodeRepository(AppDbContext db) => _db = db;

    public Task<QrCode?> FindByCodeAsync(string code, CancellationToken ct) =>
        _db.QrCodes.FirstOrDefaultAsync(q => q.Code == code, ct);

    public Task<List<QrCode>> GetAllAsync(CancellationToken ct) =>
        _db.QrCodes.Include(q => q.CreatedBy).OrderByDescending(q => q.CreatedAt).ToListAsync(ct);

    public async Task AddAsync(QrCode qr, CancellationToken ct) =>
        await _db.QrCodes.AddAsync(qr, ct);

    public Task<int> CountScansInWindowAsync(Guid qrCodeId, DateTime since, CancellationToken ct) =>
        // QrCode doesn't have per-scan log; use ScanCount as proxy for anomaly detection
        // A production implementation would use a scan_events table for accurate windowing
        _db.QrCodes
           .Where(q => q.Id == qrCodeId && q.LastScannedAt >= since)
           .Select(q => q.ScanCount)
           .FirstOrDefaultAsync(ct);

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
