using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Infrastructure.Persistence;

namespace FactoryShield.Infrastructure.Services;

public class IncidentStateLogger : IIncidentStateLogger
{
    private readonly AppDbContext _db;

    public IncidentStateLogger(AppDbContext db) => _db = db;

    public async Task LogAsync(
        Guid incidentId,
        string eventType,
        string? fromStatus,
        string? toStatus,
        Guid? actorId,
        string? actorRole,
        string? description,
        string visibilityScope = "INTERNAL",
        CancellationToken ct = default)
    {
        await _db.IncidentStateLogs.AddAsync(new IncidentStateLog
        {
            Id              = Guid.NewGuid(),
            IncidentId      = incidentId,
            EventType       = eventType,
            FromStatus      = fromStatus,
            ToStatus        = toStatus,
            ActorId         = actorId,
            ActorRole       = actorRole,
            Description     = description,
            VisibilityScope = visibilityScope,
            CreatedAt       = DateTime.UtcNow,
        }, ct);

        await _db.SaveChangesAsync(ct);
    }
}
