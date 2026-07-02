using FactoryShield.Application.Approver.Commands;
using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Capa.Commands;

public record CompleteCorrectiveActionCommand(Guid ActionId, Guid? ActorId) : IRequest;

public class CompleteCorrectiveActionCommandHandler : IRequestHandler<CompleteCorrectiveActionCommand>
{
    private readonly ICorrectiveActionRepository _repo;
    private readonly IMediator _mediator;

    public CompleteCorrectiveActionCommandHandler(ICorrectiveActionRepository repo, IMediator mediator)
    {
        _repo = repo;
        _mediator = mediator;
    }

    public async Task Handle(CompleteCorrectiveActionCommand request, CancellationToken cancellationToken)
    {
        var action = await _repo.FindByIdAsync(request.ActionId, cancellationToken)
            ?? throw new KeyNotFoundException($"Corrective action {request.ActionId} not found.");

        if (action.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
            action.Status.Equals("Verified", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Action is already completed.");

        action.Status = "Completed";
        action.CompletionPercentage = 100;
        action.UpdatedAt = DateTime.UtcNow;
        await _repo.SaveChangesAsync(cancellationToken);

        await _mediator.Send(
            new SelfResolveEscalationCommand(action.IncidentId, request.ActorId ?? Guid.Empty),
            cancellationToken);
    }
}
