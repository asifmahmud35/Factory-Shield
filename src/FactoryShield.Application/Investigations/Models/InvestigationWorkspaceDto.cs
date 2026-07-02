namespace FactoryShield.Application.Investigations.Models;

public record ChecklistItemDto(
    Guid Id,
    int SortOrder,
    string Label,
    bool IsCompleted,
    DateTime? CompletedAt
);

public record TimelineEventDto(
    Guid Id,
    string EventType,
    string Description,
    DateTime OccurredAt
);

public record InvestigationWorkspaceDto(
    Guid InvestigationId,
    Guid IncidentId,
    string IncidentReference,
    string IncidentTitle,
    string? Owner,
    DateTime? InvestigationDate,
    DateTime? TargetCompletionDate,
    string? RiskLevel,
    string? Notes,
    string? FindingsSummary,
    string? ImmediateActionTaken,
    string? LessonsLearned,
    string? RootCauseCode,
    string? RootCauseDescription,
    string InvestigationStatus,
    DateTime? InvestigationCompletedAt,
    DateTime OpenedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<ChecklistItemDto> ChecklistItems,
    IReadOnlyList<TimelineEventDto> TimelineEvents
);
