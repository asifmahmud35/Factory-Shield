using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Incidents.Commands;

public record CreateIncidentCommand(
    string Category,
    string ShortDescription,
    int? Severity,
    string? Department,
    Guid ReporterId,
    bool IsConfidential = false,
    // FS-26 QR entry
    Guid? QrCodeId = null,
    string? ManualOverrideReason = null,
    string SourceChannel = "manual",
    IncidentReportFields? ReportFields = null
) : IRequest<CreateIncidentResult>;
