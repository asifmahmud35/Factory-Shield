using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record MergeIncidentCommand(
    Guid   DuplicateIncidentId,
    Guid   PrimaryIncidentId,
    string Reason) : IRequest;

public class MergeIncidentCommandHandler : IRequestHandler<MergeIncidentCommand>
{
    private readonly IIncidentRepository _incidents;

    public MergeIncidentCommandHandler(IIncidentRepository incidents) => _incidents = incidents;

    public async Task Handle(MergeIncidentCommand request, CancellationToken cancellationToken)
    {
        if (request.DuplicateIncidentId == request.PrimaryIncidentId)
            throw new ArgumentException("An incident cannot be merged into itself.");

        var duplicate = await _incidents.GetByIdAsync(request.DuplicateIncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Incident {request.DuplicateIncidentId} not found.");

        var primary = await _incidents.GetByIdAsync(request.PrimaryIncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Primary incident {request.PrimaryIncidentId} not found.");

        if (duplicate.Status == IncidentStatus.MergedClosed)
            throw new InvalidOperationException("Incident is already merged.");

        if (primary.Status == IncidentStatus.MergedClosed)
            throw new InvalidOperationException("Cannot merge into an already-merged incident.");

        duplicate.Status       = IncidentStatus.MergedClosed;
        duplicate.MergedIntoId = request.PrimaryIncidentId;

        await _incidents.SaveChangesAsync(cancellationToken);
    }
}
