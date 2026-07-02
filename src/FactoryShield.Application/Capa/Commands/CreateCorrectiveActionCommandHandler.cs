using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using MediatR;

namespace FactoryShield.Application.Capa.Commands;

public class CreateCorrectiveActionCommandHandler : IRequestHandler<CreateCorrectiveActionCommand, Guid>
{
    private readonly IIncidentRepository _incidents;
    private readonly ICorrectiveActionRepository _repo;

    public CreateCorrectiveActionCommandHandler(
        IIncidentRepository incidents, ICorrectiveActionRepository repo)
    {
        _incidents = incidents;
        _repo = repo;
    }

    public async Task<Guid> Handle(CreateCorrectiveActionCommand request, CancellationToken cancellationToken)
    {
        var incident = await _incidents.FindByIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        var action = new CorrectiveAction
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            Title = request.Title,
            Description = request.Description,
            Owner = request.Owner,
            // Npgsql requires UTC-kind DateTimes for `timestamp with time zone` columns.
            DueDate = request.DueDate.HasValue ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc) : null,
            Priority = request.Priority,
            CompletionPercentage = 0,
            Status = "Open",
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(action, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        return action.Id;
    }
}
