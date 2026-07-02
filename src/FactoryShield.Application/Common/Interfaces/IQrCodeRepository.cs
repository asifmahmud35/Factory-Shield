using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IQrCodeRepository
{
    Task<QrCode?> FindByCodeAsync(string code, CancellationToken ct);
    Task<List<QrCode>> GetAllAsync(CancellationToken ct);
    Task AddAsync(QrCode qr, CancellationToken ct);
    Task<int> CountScansInWindowAsync(Guid qrCodeId, DateTime since, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}
