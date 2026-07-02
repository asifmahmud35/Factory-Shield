using FactoryShield.Application.Approver.Commands;
using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Capa.Commands;

public class UpdateCorrectiveActionCommandHandler : IRequestHandler<UpdateCorrectiveActionCommand>
{
    private readonly ICorrectiveActionRepository _repo;
    private readonly IMediator _mediator;

    public UpdateCorrectiveActionCommandHandler(ICorrectiveActionRepository repo, IMediator mediator)
    {
        _repo = repo;
        _mediator = mediator;
    }

    public async Task Handle(UpdateCorrectiveActionCommand request, CancellationToken cancellationToken)
    {
        var action = await _repo.FindByIdAsync(request.ActionId, cancellationToken)
            ?? throw new KeyNotFoundException($"Corrective action {request.ActionId} not found.");

        if (request.CompletionPercentage.HasValue)
            action.CompletionPercentage = Math.Clamp(request.CompletionPercentage.Value, 0, 100);

        if (request.Status is not null)   action.Status = request.Status;
        if (request.VerifiedBy is not null) action.VerifiedBy = request.VerifiedBy;
        if (request.Owner is not null)    action.Owner = request.Owner;
        // Npgsql requires UTC-kind DateTimes for `timestamp with time zone` columns.
        if (request.DueDate.HasValue)     action.DueDate = DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc);

        action.UpdatedAt = DateTime.UtcNow;
        await _repo.SaveChangesAsync(cancellationToken);

        // FS-30: When resolver makes CAPA progress, auto-resolve any stale escalation
        if (request.CompletionPercentage.HasValue && request.CompletionPercentage.Value > 0)
        {
            await _mediator.Send(
                new SelfResolveEscalationCommand(action.IncidentId, request.ActorId ?? Guid.Empty),
                cancellationToken);
        }
    }
}
