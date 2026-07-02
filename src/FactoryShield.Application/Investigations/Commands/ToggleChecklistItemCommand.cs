using MediatR;

namespace FactoryShield.Application.Investigations.Commands;

public record ToggleChecklistItemResult(bool IsCompleted, int CompletedCount, int TotalCount);

public record ToggleChecklistItemCommand(Guid IncidentId, Guid ItemId)
    : IRequest<ToggleChecklistItemResult>;
