using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using MediatR;

namespace FactoryShield.Application.QrCodes.Queries;

public record QrContextDto(
    Guid QrCodeId,
    string QrType,
    string? FactoryId,
    string? SectionId,
    string? LineId,
    string? MachineId,
    string Label
);

public record GetQrContextQuery(string Code) : IRequest<QrContextDto>;

public class GetQrContextQueryHandler : IRequestHandler<GetQrContextQuery, QrContextDto>
{
    private readonly IQrCodeRepository _qrCodes;
    private readonly INotificationRepository _notifications;

    public GetQrContextQueryHandler(
        IQrCodeRepository qrCodes,
        INotificationRepository notifications)
    {
        _qrCodes = qrCodes;
        _notifications = notifications;
    }

    public async Task<QrContextDto> Handle(GetQrContextQuery request, CancellationToken ct)
    {
        var qr = await _qrCodes.FindByCodeAsync(request.Code, ct);

        if (qr is null || !qr.IsActive)
            throw new KeyNotFoundException("QR code not found or inactive.");

        // Anomaly detection: >50 scans in 60 minutes
        var windowStart = DateTime.UtcNow.AddHours(-1);
        var recentScans = await _qrCodes.CountScansInWindowAsync(qr.Id, windowStart, ct);
        if (recentScans > 50)
        {
            var alreadyAlerted = await _notifications.ExistsAsync(
                qr.Id, "QR_SCAN_ANOMALY", "ALERT", ct);
            if (!alreadyAlerted)
            {
                await _notifications.AddAsync(new Notification
                {
                    Id = Guid.NewGuid(),
                    IncidentId = qr.Id,          // QR code Guid used as dedup key (no incident)
                    RecipientRole = "ADMIN",
                    Channel = "InApp",
                    Subject = "QR Scan Anomaly",
                    Body = $"QR code '{qr.Label}' has been scanned {recentScans} times in the last hour.",
                    Stage = "QR_SCAN_ANOMALY",
                    Type = "ALERT",
                    SentAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                }, ct);
                await _notifications.SaveChangesAsync(ct);
            }
        }

        // Update scan stats
        qr.ScanCount++;
        qr.LastScannedAt = DateTime.UtcNow;
        await _qrCodes.SaveChangesAsync(ct);

        return new QrContextDto(
            qr.Id, qr.QrType,
            qr.FactoryId, qr.SectionId, qr.LineId, qr.MachineId,
            qr.Label);
    }
}
