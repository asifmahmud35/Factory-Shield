using MediatR;

namespace FactoryShield.Application.Capa.Commands;

public record UpdateCorrectiveActionCommand(
    Guid ActionId,
    int? CompletionPercentage,
    string? Status,
    string? VerifiedBy,
    string? Owner,
    DateTime? DueDate,
    Guid? ActorId = null
) : IRequest;
