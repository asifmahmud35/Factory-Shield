using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Incidents.Queries;

public record GetIncidentDetailQuery(string IdOrReference, string CallerRole, Guid? CurrentUserId = null) : IRequest<IncidentDetailDto?>;

public class GetIncidentDetailQueryHandler : IRequestHandler<GetIncidentDetailQuery, IncidentDetailDto?>
{
    private readonly IIncidentRepository _incidents;
    private readonly ISlaClockRepository _slaClocks;
    private readonly IConfidentialityService _confidentiality;
    private readonly IIdentityAccessAuditRepository _identityAudit;

    public GetIncidentDetailQueryHandler(
        IIncidentRepository incidents,
        ISlaClockRepository slaClocks,
        IConfidentialityService confidentiality,
        IIdentityAccessAuditRepository identityAudit)
    {
        _incidents = incidents;
        _slaClocks = slaClocks;
        _confidentiality = confidentiality;
        _identityAudit = identityAudit;
    }

    public async Task<IncidentDetailDto?> Handle(GetIncidentDetailQuery request, CancellationToken ct)
    {
        var incident = Guid.TryParse(request.IdOrReference, out var id)
            ? await _incidents.FindByIdAsync(id, ct)
            : await _incidents.FindByReferenceAsync(request.IdOrReference, ct);

        if (incident is null) return null;

        var clocks = await _slaClocks.GetActiveByIncidentIdsAsync([incident.Id], ct);
        var clock = clocks.FirstOrDefault();

        var reporterDisplay = _confidentiality.GetReporterDisplay(incident, request.CallerRole);

        // FS-24 audit: log every time a protected identity is actually disclosed to a viewer
        // (not just via the explicit unmask action) — required for confidentiality audit trail.
        if (_confidentiality.IsConfidential(incident) && reporterDisplay is not null && request.CurrentUserId.HasValue)
        {
            await _identityAudit.AddAsync(new Domain.Entities.IdentityAccessAudit
            {
                Id = Guid.NewGuid(),
                IncidentId = incident.Id,
                AccessedById = request.CurrentUserId.Value,
                AccessedByRole = request.CallerRole,
                Reason = "Viewed confidential incident detail",
                AccessedAt = DateTime.UtcNow,
            }, ct);
            await _identityAudit.SaveChangesAsync(ct);
        }

        return new IncidentDetailDto(
            incident.Id,
            incident.IncidentReference,
            incident.Category,
            incident.Severity,
            DisplayStatusMapper.Map(incident.Status),
            incident.ShortDescription,
            incident.Department,
            incident.CreatedAt,
            reporterDisplay,
            incident.AssignedResolver?.Name,
            clock?.StartedAt,
            clock?.TargetMinutes,
            clock?.Stage,
            _confidentiality.IsConfidential(incident),
            incident.EscalationLevel,
            incident.SourceChannel,
            incident.RejectReason,
            incident.ClassificationCategory,
            incident.SubCategory,
            incident.Factory,
            incident.Building,
            incident.Floor,
            incident.Equipment,
            incident.ProductionOrder,
            incident.Buyer,
            incident.StyleNumber,
            incident.IncidentOccurredAt,
            incident.ReporterName,
            incident.EmployeeId,
            incident.ReporterDepartment,
            incident.ContactNumber,
            incident.Witnesses,
            incident.ImmediateActionTaken,
            incident.ExactLocation,
            incident.GpsCoordinates,
            incident.AiSummary);
    }
}
