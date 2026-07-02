using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FactoryShield.Application.Compliance.Models;
using FactoryShield.Application.Compliance.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/compliance")]
[Authorize(Policy = "ComplianceOfficerOnly")]
public class ComplianceController : ControllerBase
{
    private readonly IMediator _mediator;

    public ComplianceController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// 7-panel compliance dashboard. Query params: from, to (ISO 8601 dates).
    /// Defaults to last 30 days if omitted.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var currentUserId = ResolveCurrentUserId();
        if (currentUserId == Guid.Empty) return Unauthorized();

        var result = await _mediator.Send(
            new GetComplianceDashboardQuery(
                from ?? DateTime.UtcNow.AddDays(-30),
                to   ?? DateTime.UtcNow,
                currentUserId), ct);

        return Ok(result);
    }

    /// <summary>
    /// Dedicated identity-access audit log. Filters: from, to, actorId (all optional).
    /// Excludes entries made by the currently-authenticated Compliance Officer (SoD).
    /// </summary>
    [HttpGet("identity-access-audit")]
    public async Task<IActionResult> GetIdentityAccessAudit(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? actorId,
        CancellationToken ct)
    {
        var currentUserId = ResolveCurrentUserId();
        if (currentUserId == Guid.Empty) return Unauthorized();

        var result = await _mediator.Send(
            new GetIdentityAccessAuditQuery(from, to, actorId, currentUserId), ct);

        return Ok(result);
    }

    /// <summary>
    /// Generate a watermarked PDF evidence package for a single incident.
    /// Writes an identity_access_audit row for the export action itself.
    /// </summary>
    [HttpGet("export/{incidentId:guid}")]
    public async Task<IActionResult> ExportAuditPackage(
        Guid incidentId,
        CancellationToken ct)
    {
        var currentUserId = ResolveCurrentUserId();
        if (currentUserId == Guid.Empty) return Unauthorized();

        var currentUserName = User.FindFirstValue(ClaimTypes.Name)
                           ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                           ?? "Unknown";

        ComplianceExportPackageDto package;
        try
        {
            package = await _mediator.Send(
                new GetComplianceExportQuery(incidentId, currentUserId, currentUserName), ct);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }

        var pdfBytes = BuildWatermarkedPdf(package, currentUserName);
        return File(pdfBytes, "application/pdf",
            $"audit-package-{package.IncidentReference}-{DateTime.UtcNow:yyyyMMdd}.pdf");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid ResolveCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }

    private static byte[] BuildWatermarkedPdf(ComplianceExportPackageDto pkg, string exporterName)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"CONFIDENTIAL AUDIT PACKAGE");
        sb.AppendLine($"iFar-Silexa (Pvt.) Ltd. | Case {pkg.IncidentReference} | Exported by {exporterName} on {pkg.ExportedAt:yyyy-MM-dd HH:mm} UTC");
        sb.AppendLine(new string('-', 60));
        sb.AppendLine();
        sb.AppendLine($"Incident Reference : {pkg.IncidentReference}");
        sb.AppendLine($"Status             : {pkg.Status}");
        sb.AppendLine($"Category           : {pkg.Category}");
        sb.AppendLine($"Severity           : {SeverityLabel(pkg.Severity)}");
        sb.AppendLine($"Department         : {pkg.Department ?? "N/A"}");
        sb.AppendLine($"Reported At        : {pkg.CreatedAt:yyyy-MM-dd HH:mm} UTC");
        sb.AppendLine($"Reporter           : {pkg.ReporterName}");
        sb.AppendLine($"Resolver           : {pkg.ResolverName ?? "Unassigned"}");
        sb.AppendLine();

        sb.AppendLine("── APPROVAL CHAIN ──");
        if (pkg.ApprovalEvents.Count == 0)
            sb.AppendLine("  (no approval votes recorded)");
        foreach (var ev in pkg.ApprovalEvents)
        {
            var decision = ev.IsApprove ? "APPROVED" : "REJECTED";
            sb.AppendLine($"  [{ev.SubmittedAt:yyyy-MM-dd HH:mm}] {ev.Gate} — {decision} by {ev.ActorName}");
            if (!ev.IsApprove && ev.RejectionReason is not null)
                sb.AppendLine($"    Reason: {ev.RejectionReason}");
        }

        sb.AppendLine();
        sb.AppendLine("── CORRECTIVE ACTIONS (CAPA) ──");
        if (pkg.CorrectiveActions.Count == 0)
            sb.AppendLine("  (no corrective actions)");
        foreach (var ca in pkg.CorrectiveActions)
        {
            var due = ca.DueDate.HasValue ? ca.DueDate.Value.ToString("yyyy-MM-dd") : "N/A";
            sb.AppendLine($"  {ca.Title} | Status: {ca.Status} | Due: {due} | Rejections: {ca.RejectionCount}");
        }

        sb.AppendLine();
        sb.AppendLine("── IDENTITY ACCESS AUDIT ──");
        if (pkg.IdentityAuditEntries.Count == 0)
            sb.AppendLine("  (no identity access events)");
        foreach (var a in pkg.IdentityAuditEntries)
            sb.AppendLine($"  [{a.AccessedAt:yyyy-MM-dd HH:mm}] {a.AccessorName} ({a.AccessorRole}) — {a.Purpose}");

        sb.AppendLine();
        sb.AppendLine(new string('=', 60));
        sb.AppendLine($"CONFIDENTIAL — iFar-Silexa (Pvt.) Ltd. — Case {pkg.IncidentReference} — Exported by {exporterName} on {pkg.ExportedAt:yyyy-MM-dd}");

        return BuildPdf(sb.ToString(), watermark: $"CONFIDENTIAL — {pkg.IncidentReference}");
    }

    private static string SeverityLabel(int s) => s switch
    {
        1 => "CRITICAL",
        2 => "HIGH",
        3 => "MEDIUM",
        _ => "LOW"
    };

    private static byte[] BuildPdf(string text, string watermark)
    {
        var escaped = text.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
        var wm      = watermark.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");

        var content = new StringBuilder();
        content.AppendLine("BT /F1 10 Tf 40 750 Td 12 TL");
        // Watermark header in grey-ish (just bold italic using standard font here)
        content.AppendLine($"({wm}) Tj");
        content.AppendLine("T*");

        var lines = escaped.Split('\n').Select(l => l.TrimEnd('\r'));
        foreach (var line in lines)
        {
            content.AppendLine("T*");
            content.AppendLine($"({line}) Tj");
        }
        content.AppendLine("ET");

        var stream = content.ToString();
        var pdf = $"%PDF-1.4\n" +
                  $"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
                  $"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
                  $"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n" +
                  $"4 0 obj<</Length {Encoding.UTF8.GetByteCount(stream)}>>\nstream\n" +
                  stream +
                  $"endstream endobj\n" +
                  $"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
                  $"xref\n0 6\n0000000000 65535 f \n" +
                  $"trailer<</Size 6/Root 1 0 R>>\nstartxref\n500\n%%EOF\n";

        return Encoding.UTF8.GetBytes(pdf);
    }
}
