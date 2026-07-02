using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Investigations.Commands;

public class ToggleChecklistItemCommandHandler
    : IRequestHandler<ToggleChecklistItemCommand, ToggleChecklistItemResult>
{
    private readonly IInvestigationRepository _investigations;

    public ToggleChecklistItemCommandHandler(IInvestigationRepository investigations)
        => _investigations = investigations;

    public async Task<ToggleChecklistItemResult> Handle(
        ToggleChecklistItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _investigations.FindChecklistItemAsync(request.ItemId, cancellationToken)
            ?? throw new KeyNotFoundException($"Checklist item {request.ItemId} not found.");

        item.IsCompleted = !item.IsCompleted;
        item.CompletedAt = item.IsCompleted ? DateTime.UtcNow : null;

        // Load investigation to get full counts
        var investigation = await _investigations.FindByIncidentIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Investigation for incident {request.IncidentId} not found.");

        investigation.UpdatedAt = DateTime.UtcNow;
        await _investigations.SaveChangesAsync(cancellationToken);

        var completedCount = investigation.ChecklistItems.Count(c => c.IsCompleted);
        var totalCount = investigation.ChecklistItems.Count;

        return new ToggleChecklistItemResult(item.IsCompleted, completedCount, totalCount);
    }
}
