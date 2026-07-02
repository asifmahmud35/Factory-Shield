namespace FactoryShield.Application.Governance.Models;

public record IncidentTimelineEntryDto(
    Guid Id,
    string EventType,
    string? FromStatus,
    string? ToStatus,
    string? ActorEmail,
    string? ActorRole,
    string? Description,
    string? PreviousValue,
    string? NewValue,
    string VisibilityScope,
    DateTime CreatedAt
);
