using MediatR;

namespace FactoryShield.Application.Investigations.Commands;

public record SaveInvestigationCommand(
    Guid IncidentId,
    string? Owner,
    DateTime? InvestigationDate,
    DateTime? TargetCompletionDate,
    string? RiskLevel,
    string? Notes,
    string? FindingsSummary,
    string? ImmediateActionTaken,
    string? LessonsLearned,
    string? RootCauseCode = null,
    string? RootCauseDescription = null
) : IRequest;
