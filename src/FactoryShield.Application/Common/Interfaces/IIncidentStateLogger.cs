namespace FactoryShield.Application.Common.Interfaces;

public interface IIncidentStateLogger
{
    Task LogAsync(
        Guid incidentId,
        string eventType,
        string? fromStatus,
        string? toStatus,
        Guid? actorId,
        string? actorRole,
        string? description,
        string visibilityScope = "INTERNAL",
        CancellationToken ct = default);
}
