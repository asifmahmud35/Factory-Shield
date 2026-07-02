using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FactoryShield.Application.Incidents.Commands;
using FactoryShield.Application.Incidents.Models;
using FactoryShield.Application.Incidents.Queries;
using FactoryShield.Application.Investigations.Queries;
using FactoryShield.Application.Capa.Queries;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FactoryShield.Application.QrCodes.Queries;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/incidents")]
[Authorize]
public class IncidentController : ControllerBase
{
    private readonly IMediator _mediator;

    public IncidentController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIncidentRequest request, CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(sub, out var reporterId))
            return Unauthorized();

        try
        {
            var result = await _mediator.Send(new CreateIncidentCommand(
                request.Category,
                request.ShortDescription,
                request.Severity,
                request.Department,
                reporterId,
                request.IsConfidential ?? false,
                request.QrCodeId,
                request.ManualOverrideReason,
                request.QrCodeId.HasValue ? "qr" : "manual",
                request.ToReportFields()
            ), ct);

            return StatusCode(201, new { incident_id = result.IncidentId, incident_reference = result.IncidentReference });
        }
        catch (ValidationException ex)
        {
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            return BadRequest(new { errors });
        }
    }

    /// <summary>Lookup data for the 8-step report wizard (any authenticated user).</summary>
    [HttpGet("report-form-options")]
    public async Task<IActionResult> GetReportFormOptions(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetReportFormOptionsQuery(), ct);
        return Ok(result);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(sub, out var reporterId))
            return Unauthorized();

        var result = await _mediator.Send(new GetMyIncidentsQuery(reporterId), ct);
        return Ok(result);
    }

    /// <summary>Org-wide incident list ("All Incidents") — every incident, not just the caller's own.</summary>
    [HttpGet]
    [Authorize(Policy = "AllIncidentsAccess")]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "";
        var result = await _mediator.Send(new GetAllIncidentsQuery(role), ct);
        return Ok(result);
    }

    /// <summary>Single incident detail by UUID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "REPORTER";
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(sub, out var currentUserId);
        var result = await _mediator.Send(new GetIncidentDetailQuery(id.ToString(), role, currentUserId), ct);
        if (result is null) return NotFound(new { error = "Incident not found." });
        return Ok(result);
    }

    /// <summary>Single incident detail by reference (e.g. INC-2026-0001).</summary>
    [HttpGet("ref/{reference}")]
    public async Task<IActionResult> GetByReference(string reference, CancellationToken ct)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "REPORTER";
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(sub, out var currentUserId);
        var result = await _mediator.Send(new GetIncidentDetailQuery(reference, role, currentUserId), ct);
        if (result is null) return NotFound(new { error = "Incident not found." });
        return Ok(result);
    }

    // ── FS-19: Reporter provides info (resumes SLA) ───────────────────────────

    // ── FS-25: Offline sync ───────────────────────────────────────────────────

    [HttpPost("offline-sync")]
    public async Task<IActionResult> OfflineSync(
        [FromBody] List<SyncOfflineDraftPayloadRequest> drafts,
        CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(sub, out var reporterId)) return Unauthorized();

        var payloads = drafts.Select(d => new SyncOfflineDraftPayload(
            d.LocalDraftId, d.PayloadHash, d.Category, d.ShortDescription,
            d.Severity, d.Department, d.LocalEventTime, d.IsConfidential,
            d.ToReportFields())).ToList();

        var results = await _mediator.Send(
            new SyncOfflineDraftsBatchCommand(reporterId, payloads), ct);

        return Ok(results);
    }

    [HttpGet("offline-sync/status")]
    public async Task<IActionResult> OfflineSyncStatus(CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(sub, out var reporterId)) return Unauthorized();

        var result = await _mediator.Send(new GetOfflineSyncStatusQuery(reporterId), ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/provide-info")]
    public async Task<IActionResult> ProvideInfo(Guid id, [FromBody] ProvideInfoRequest request, CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(sub, out var reporterId)) return Unauthorized();

        try
        {
            await _mediator.Send(new ProvideInfoCommand(id, request.Response, reporterId), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (ArgumentException ex)         { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/attachments")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadAttachment(Guid id, IFormFile file, CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(sub, out var uploadedBy))
            return Unauthorized();

        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        try
        {
            await using var stream = file.OpenReadStream();
            var result = await _mediator.Send(new UploadAttachmentCommand(
                id,
                stream,
                file.FileName,
                file.ContentType,
                file.Length,
                uploadedBy
            ), ct);

            return StatusCode(201, new { attachment_id = result.AttachmentId });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            return BadRequest(new { errors });
        }
    }

    [HttpGet("{id:guid}/actions/summary")]
    public async Task<IActionResult> GetActionsSummary(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetActionsSummaryQuery(id), ct);
        return Ok(result);
    }

    /// <summary>List an incident's evidence attachments (metadata). Any authenticated user.</summary>
    [HttpGet("{id:guid}/attachments")]
    public async Task<IActionResult> GetAttachments(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAttachmentsQuery(id), ct);
        return Ok(result);
    }
}

public record SyncOfflineDraftPayloadRequest(
    string LocalDraftId,
    string PayloadHash,
    string Category,
    string ShortDescription,
    int? Severity,
    string? Department,
    DateTime LocalEventTime,
    bool IsConfidential = false,
    string? ClassificationCategory = null,
    string? SubCategory = null,
    string? Factory = null,
    string? Building = null,
    string? Floor = null,
    string? Equipment = null,
    string? ProductionOrder = null,
    string? Buyer = null,
    string? StyleNumber = null,
    DateTime? IncidentOccurredAt = null,
    string? ReporterName = null,
    string? EmployeeId = null,
    string? ReporterDepartment = null,
    string? ContactNumber = null,
    string? Witnesses = null,
    string? ImmediateActionTaken = null,
    string? ExactLocation = null,
    string? GpsCoordinates = null,
    string? AiSummary = null
)
{
    public IncidentReportFields? ToReportFields() => IncidentReportFieldsMapper.From(this);
}

public record CreateIncidentRequest(
    string Category,
    string ShortDescription,
    int? Severity,
    string? Department,
    bool? IsConfidential = null,
    Guid? QrCodeId = null,
    string? ManualOverrideReason = null,
    string? ClassificationCategory = null,
    string? SubCategory = null,
    string? Factory = null,
    string? Building = null,
    string? Floor = null,
    string? Equipment = null,
    string? ProductionOrder = null,
    string? Buyer = null,
    string? StyleNumber = null,
    DateTime? IncidentOccurredAt = null,
    string? ReporterName = null,
    string? EmployeeId = null,
    string? ReporterDepartment = null,
    string? ContactNumber = null,
    string? Witnesses = null,
    string? ImmediateActionTaken = null,
    string? ExactLocation = null,
    string? GpsCoordinates = null,
    string? AiSummary = null
)
{
    public IncidentReportFields? ToReportFields() => IncidentReportFieldsMapper.From(this);
}

file static class IncidentReportFieldsMapper
{
    public static IncidentReportFields? From(CreateIncidentRequest r) =>
        HasAnyReportField(r) ? new IncidentReportFields(
            r.ClassificationCategory, r.SubCategory, r.Factory, r.Building, r.Floor,
            r.Equipment, r.ProductionOrder, r.Buyer, r.StyleNumber, r.IncidentOccurredAt,
            r.ReporterName, r.EmployeeId, r.ReporterDepartment, r.ContactNumber,
            r.Witnesses, r.ImmediateActionTaken, r.ExactLocation, r.GpsCoordinates, r.AiSummary)
        : null;

    public static IncidentReportFields? From(SyncOfflineDraftPayloadRequest r) =>
        HasAnyReportField(r) ? new IncidentReportFields(
            r.ClassificationCategory, r.SubCategory, r.Factory, r.Building, r.Floor,
            r.Equipment, r.ProductionOrder, r.Buyer, r.StyleNumber, r.IncidentOccurredAt,
            r.ReporterName, r.EmployeeId, r.ReporterDepartment, r.ContactNumber,
            r.Witnesses, r.ImmediateActionTaken, r.ExactLocation, r.GpsCoordinates, r.AiSummary)
        : null;

    private static bool HasAnyReportField(CreateIncidentRequest r) =>
        r.ClassificationCategory is not null || r.SubCategory is not null || r.Factory is not null
        || r.Building is not null || r.Floor is not null || r.Equipment is not null
        || r.ProductionOrder is not null || r.Buyer is not null || r.StyleNumber is not null
        || r.IncidentOccurredAt is not null || r.ReporterName is not null || r.EmployeeId is not null
        || r.ReporterDepartment is not null || r.ContactNumber is not null || r.Witnesses is not null
        || r.ImmediateActionTaken is not null || r.ExactLocation is not null
        || r.GpsCoordinates is not null || r.AiSummary is not null;

    private static bool HasAnyReportField(SyncOfflineDraftPayloadRequest r) =>
        r.ClassificationCategory is not null || r.SubCategory is not null || r.Factory is not null
        || r.Building is not null || r.Floor is not null || r.Equipment is not null
        || r.ProductionOrder is not null || r.Buyer is not null || r.StyleNumber is not null
        || r.IncidentOccurredAt is not null || r.ReporterName is not null || r.EmployeeId is not null
        || r.ReporterDepartment is not null || r.ContactNumber is not null || r.Witnesses is not null
        || r.ImmediateActionTaken is not null || r.ExactLocation is not null
        || r.GpsCoordinates is not null || r.AiSummary is not null;
}
public record ProvideInfoRequest(string Response);
