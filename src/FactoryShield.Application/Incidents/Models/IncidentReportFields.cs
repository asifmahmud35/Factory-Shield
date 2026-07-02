namespace FactoryShield.Application.Incidents.Models;

/// <summary>Optional fields collected by the 8-step report wizard.</summary>
public record IncidentReportFields(
    string? ClassificationCategory = null,
    string? SubCategory = null,
    string? Factory = null,
    string? Building = null,
    string? Floor = null,
    string? Equipment = null,
    string? ProductionOrder = null,
    string? Buyer = null,
    string? StyleNumber = null,
    DateTime? IncidentOccurredAt = null,
    string? ReporterName = null,
    string? EmployeeId = null,
    string? ReporterDepartment = null,
    string? ContactNumber = null,
    string? Witnesses = null,
    string? ImmediateActionTaken = null,
    string? ExactLocation = null,
    string? GpsCoordinates = null,
    string? AiSummary = null
);
