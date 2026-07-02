using MediatR;

namespace FactoryShield.Application.Capa.Commands;

public record CreateCorrectiveActionCommand(
    Guid IncidentId,
    string Title,
    string? Description,
    string? Owner,
    DateTime? DueDate,
    int Priority
) : IRequest<Guid>;
