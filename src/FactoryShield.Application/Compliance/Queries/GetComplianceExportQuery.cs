using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Compliance.Models;
using MediatR;

namespace FactoryShield.Application.Compliance.Queries;

public record ComplianceExportPackageDto(
    string IncidentReference,
    string Status,
    string Category,
    int Severity,
    string? Department,
    DateTime CreatedAt,
    string ReporterName,
    string? ResolverName,
    List<ApprovalEventExportDto> ApprovalEvents,
    List<CapaExportDto> CorrectiveActions,
    List<IdentityAccessAuditItem> IdentityAuditEntries,
    string ExportedByName,
    DateTime ExportedAt
);

public record ApprovalEventExportDto(
    string Gate,
    string ActorName,
    bool IsApprove,
    string? RejectionReason,
    DateTime SubmittedAt
);

public record CapaExportDto(
    string Title,
    string Status,
    DateTime? DueDate,
    int RejectionCount
);

public record GetComplianceExportQuery(Guid IncidentId, Guid CurrentUserId, string CurrentUserName)
    : IRequest<ComplianceExportPackageDto>;

public class GetComplianceExportQueryHandler
    : IRequestHandler<GetComplianceExportQuery, ComplianceExportPackageDto>
{
    private readonly IIncidentRepository _incidents;
    private readonly IApprovalEventRepository _approvals;
    private readonly IIdentityAccessAuditRepository _identityAudit;
    private readonly ICorrectiveActionRepository _capa;

    public GetComplianceExportQueryHandler(
        IIncidentRepository incidents,
        IApprovalEventRepository approvals,
        IIdentityAccessAuditRepository identityAudit,
        ICorrectiveActionRepository capa)
    {
        _incidents     = incidents;
        _approvals     = approvals;
        _identityAudit = identityAudit;
        _capa          = capa;
    }

    public async Task<ComplianceExportPackageDto> Handle(
        GetComplianceExportQuery request, CancellationToken ct)
    {
        var incident = await _incidents.FindByIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        var approvalEvents = await _approvals.GetByIncidentIdAsync(request.IncidentId, ct);
        var capaList       = await _capa.GetByIncidentIdAsync(request.IncidentId, ct);
        var auditEntries   = await _identityAudit.GetByIncidentIdAsync(request.IncidentId, ct);

        // Write an audit row for this export event itself.
        await _identityAudit.AddAsync(new Domain.Entities.IdentityAccessAudit
        {
            Id             = Guid.NewGuid(),
            IncidentId     = incident.Id,
            AccessedById   = request.CurrentUserId,
            AccessedByRole = "ADMIN",
            Reason         = "Compliance export audit package generated",
            AccessedAt     = DateTime.UtcNow,
        }, ct);
        await _identityAudit.SaveChangesAsync(ct);

        var approvalDtos = approvalEvents.Select(e => new ApprovalEventExportDto(
            e.ApprovalType.ToString(),
            e.Actor?.Name ?? e.ActorId.ToString(),
            e.IsApprove,
            e.RejectionReason,
            e.SubmittedAt
        )).ToList();

        var capaDtos = capaList.Select(ca => new CapaExportDto(
            ca.Title,
            ca.Status,
            ca.DueDate,
            ca.CapaRejectionCount
        )).ToList();

        var auditDtos = auditEntries.Select(a => new IdentityAccessAuditItem(
            a.AccessedBy?.Name ?? a.AccessedById.ToString(),
            a.AccessedBy?.Role?.Code ?? a.AccessedByRole,
            incident.IncidentReference,
            a.Reason ?? "No reason given",
            a.AccessedAt
        )).ToList();

        return new ComplianceExportPackageDto(
            IncidentReference:    incident.IncidentReference,
            Status:               incident.Status.ToString(),
            Category:             incident.Category,
            Severity:             incident.Severity,
            Department:           incident.Department,
            CreatedAt:            incident.CreatedAt,
            ReporterName:         incident.Reporter?.Name ?? "Anonymous",
            ResolverName:         incident.AssignedResolver?.Name,
            ApprovalEvents:       approvalDtos,
            CorrectiveActions:    capaDtos,
            IdentityAuditEntries: auditDtos,
            ExportedByName:       request.CurrentUserName,
            ExportedAt:           DateTime.UtcNow
        );
    }
}
