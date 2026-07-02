namespace FactoryShield.Application.Approver.Models;

public record ActiveEscalationDto(
    Guid Id,
    Guid IncidentId,
    string IncidentReference,
    string Severity,
    string Title,
    string EscalatedTo,
    int Day,
    int ProgressPct,
    int SlaRemainingMinutes,
    bool SlaOverdue
);
