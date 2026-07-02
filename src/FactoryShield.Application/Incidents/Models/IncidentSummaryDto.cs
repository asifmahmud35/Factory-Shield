namespace FactoryShield.Application.Incidents.Models;

public record IncidentSummaryDto(
    Guid Id,
    string IncidentReference,
    string Category,
    int Severity,
    string DisplayStatus,
    DateTime CreatedAt,
    DateTime? SlaStartedAt = null,
    int? SlaTargetMinutes = null,
    string? SlaStage = null,
    // FS-16 claim info
    Guid? ClaimedById = null,
    string? ClaimedByEmail = null,
    DateTime? ClaimExpiresAt = null,
    // FS-24 confidentiality
    bool IsConfidential = false,
    string? ReporterDisplay = null,
    // Org-wide "All Incidents" view
    string? Department = null,
    string? AssignedToName = null,
    string? Area = null,
    DateTime? IncidentDate = null
);
