using FactoryShield.Application.Incidents.Models;
using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Incidents;

internal static class IncidentReportFieldMapper
{
    public static void Apply(Incident incident, IncidentReportFields? fields)
    {
        if (fields is null) return;

        incident.ClassificationCategory = NullIfBlank(fields.ClassificationCategory);
        incident.SubCategory = NullIfBlank(fields.SubCategory);
        incident.Factory = NullIfBlank(fields.Factory);
        incident.Building = NullIfBlank(fields.Building);
        incident.Floor = NullIfBlank(fields.Floor);
        incident.Equipment = NullIfBlank(fields.Equipment);
        incident.ProductionOrder = NullIfBlank(fields.ProductionOrder);
        incident.Buyer = NullIfBlank(fields.Buyer);
        incident.StyleNumber = NullIfBlank(fields.StyleNumber);
        incident.IncidentOccurredAt = fields.IncidentOccurredAt;
        incident.ReporterName = NullIfBlank(fields.ReporterName);
        incident.EmployeeId = NullIfBlank(fields.EmployeeId);
        incident.ReporterDepartment = NullIfBlank(fields.ReporterDepartment);
        incident.ContactNumber = NullIfBlank(fields.ContactNumber);
        incident.Witnesses = NullIfBlank(fields.Witnesses);
        incident.ImmediateActionTaken = NullIfBlank(fields.ImmediateActionTaken);
        incident.ExactLocation = NullIfBlank(fields.ExactLocation);
        incident.GpsCoordinates = NullIfBlank(fields.GpsCoordinates);
        incident.AiSummary = NullIfBlank(fields.AiSummary);
    }

    private static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
