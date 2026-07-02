using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using MediatR;

namespace FactoryShield.Application.Governance.Commands;

public record UnmaskReporterIdentityCommand(
    Guid IncidentId,
    Guid AccessorId,
    string AccessorRole,
    string Reason
) : IRequest<string?>;

public class UnmaskReporterIdentityCommandHandler : IRequestHandler<UnmaskReporterIdentityCommand, string?>
{
    private readonly IIncidentRepository _incidents;
    private readonly IIdentityAccessAuditRepository _auditRepo;

    public UnmaskReporterIdentityCommandHandler(
        IIncidentRepository incidents,
        IIdentityAccessAuditRepository auditRepo)
    {
        _incidents = incidents;
        _auditRepo = auditRepo;
    }

    public async Task<string?> Handle(UnmaskReporterIdentityCommand request, CancellationToken ct)
    {
        var incident = await _incidents.FindByIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        if (incident.ReporterVisibility == "anonymous")
            throw new UnauthorizedAccessException("Reporter identity is anonymous and cannot be unmasked.");

        await _auditRepo.AddAsync(new IdentityAccessAudit
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            AccessedById = request.AccessorId,
            AccessedByRole = request.AccessorRole,
            Reason = request.Reason,
            AccessedAt = DateTime.UtcNow,
        }, ct);

        await _auditRepo.SaveChangesAsync(ct);

        return incident.Reporter?.Email;
    }
}
