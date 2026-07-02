using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Infrastructure.Persistence;

namespace FactoryShield.Infrastructure.Services;

public class EscalationNotificationRecorder : IEscalationNotificationRecorder
{
    private readonly AppDbContext _db;

    public EscalationNotificationRecorder(AppDbContext db) => _db = db;

    public async Task RecordAsync(
        Guid? incidentId,
        string incidentReference,
        Guid? ruleId,
        string ruleName,
        string via,
        string recipients,
        string status = "Delivered",
        CancellationToken ct = default)
    {
        await _db.EscalationNotificationRecords.AddAsync(new EscalationNotificationRecord
        {
            Id                = Guid.NewGuid(),
            IncidentId        = incidentId,
            RuleId            = ruleId,
            IncidentReference = incidentReference,
            RuleName          = ruleName,
            Via               = via,
            Recipients        = recipients,
            SentAt            = DateTime.UtcNow,
            Status            = status,
        }, ct);
        await _db.SaveChangesAsync(ct);
    }
}
