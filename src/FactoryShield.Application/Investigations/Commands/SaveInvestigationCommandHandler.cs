using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Investigations.Commands;

public class SaveInvestigationCommandHandler : IRequestHandler<SaveInvestigationCommand>
{
    private readonly IInvestigationRepository _investigations;

    public SaveInvestigationCommandHandler(IInvestigationRepository investigations)
        => _investigations = investigations;

    public async Task Handle(SaveInvestigationCommand request, CancellationToken cancellationToken)
    {
        var inv = await _investigations.FindByIncidentIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"No investigation found for incident {request.IncidentId}.");

        if (request.Owner is not null)            inv.Owner = request.Owner;
        // Npgsql requires UTC-kind DateTimes for `timestamp with time zone` columns; date-only
        // inputs deserialize with Kind=Unspecified, which throws otherwise.
        if (request.InvestigationDate.HasValue)
            inv.InvestigationDate = DateTime.SpecifyKind(request.InvestigationDate.Value, DateTimeKind.Utc);
        if (request.TargetCompletionDate.HasValue)
            inv.TargetCompletionDate = DateTime.SpecifyKind(request.TargetCompletionDate.Value, DateTimeKind.Utc);
        if (request.Notes is not null)             inv.Notes = request.Notes;
        if (request.FindingsSummary is not null)   inv.FindingsSummary = request.FindingsSummary;
        if (request.ImmediateActionTaken is not null) inv.ImmediateActionTaken = request.ImmediateActionTaken;
        if (request.LessonsLearned is not null)    inv.LessonsLearned = request.LessonsLearned;

        if (request.RiskLevel is not null &&
            Enum.TryParse<RiskLevel>(request.RiskLevel, ignoreCase: true, out var risk))
        {
            inv.RiskLevel = risk;
        }

        if (request.RootCauseCode is not null)
        {
            inv.RootCauseCode = request.RootCauseCode;
            inv.InvestigationStatus = "ROOT_CAUSE_IDENTIFIED";
            inv.InvestigationCompletedAt ??= DateTime.UtcNow;
        }

        if (request.RootCauseDescription is not null)
            inv.RootCauseDescription = request.RootCauseDescription;

        inv.UpdatedAt = DateTime.UtcNow;

        await _investigations.SaveChangesAsync(cancellationToken);
    }
}
