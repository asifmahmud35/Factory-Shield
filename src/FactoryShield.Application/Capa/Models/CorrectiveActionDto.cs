namespace FactoryShield.Application.Capa.Models;

public record CorrectiveActionDto(
    Guid Id,
    Guid IncidentId,
    string Title,
    string? Description,
    string? Owner,
    DateTime? DueDate,
    int Priority,
    int CompletionPercentage,
    string Status,
    string? VerifiedBy,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
