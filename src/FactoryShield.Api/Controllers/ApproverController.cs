using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FactoryShield.Application.Approver.Commands;
using FactoryShield.Application.Approver.Queries;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/approver")]
[Authorize(Policy = "ApproverOnly")]
public class ApproverController : ControllerBase
{
    private readonly IMediator _mediator;

    public ApproverController(IMediator mediator) => _mediator = mediator;

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetApproverQueueQuery(), ct);
        return Ok(result);
    }

    [HttpGet("resolvers")]
    public async Task<IActionResult> GetResolvers(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetResolversQuery(), ct);
        return Ok(result);
    }

    [HttpPost("/api/v1/incidents/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveIncidentRequest request, CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        try
        {
            await _mediator.Send(new ApproveIncidentCommand(id, request.ResolverUserId, actorId.Value), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (ValidationException ex)
        {
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            return BadRequest(new { errors });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectIncidentRequest request, CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        try
        {
            await _mediator.Send(new RejectIncidentCommand(id, request.RejectType, request.Reason, actorId.Value), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (ValidationException ex)
        {
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            return BadRequest(new { errors });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/escalate")]
    public async Task<IActionResult> Escalate(Guid id, [FromBody] EscalateIncidentRequest request, CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        try
        {
            await _mediator.Send(new EscalateIncidentCommand(id, request.Reason, actorId.Value), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (ArgumentException ex)         { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/claim")]
    public async Task<IActionResult> Claim(Guid id, CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        try
        {
            await _mediator.Send(new ClaimIncidentCommand(id, actorId.Value), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpDelete("/api/v1/incidents/{id:guid}/claim")]
    public async Task<IActionResult> ReleaseClaim(Guid id, CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        try
        {
            await _mediator.Send(new ReleaseClaimCommand(id, actorId.Value), ct);
            return Ok();
        }
        catch (InvalidOperationException) { return Forbid(); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/reassign")]
    public async Task<IActionResult> Reassign(Guid id, [FromBody] ReassignIncidentRequest request, CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        try
        {
            await _mediator.Send(new ReassignIncidentCommand(id, request.NewCategory, request.NewSeverity, request.Reason, actorId.Value), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/merge")]
    public async Task<IActionResult> Merge(Guid id, [FromBody] MergeIncidentRequest request, CancellationToken ct)
    {
        try
        {
            await _mediator.Send(new MergeIncidentCommand(id, request.PrimaryIncidentId, request.Reason), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (ArgumentException ex)         { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/request-info")]
    public async Task<IActionResult> RequestInfo(Guid id, [FromBody] RequestInfoRequest request, CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        try
        {
            await _mediator.Send(new RequestInfoCommand(id, request.Question, actorId.Value), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (ArgumentException ex)         { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/escalation/{escalationId:guid}/acknowledge")]
    public async Task<IActionResult> AcknowledgeEscalation(Guid id, Guid escalationId, CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        var roleClaim = User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role")
            ?? "UNKNOWN";

        try
        {
            await _mediator.Send(new AcknowledgeEscalationCommand(id, escalationId, actorId.Value, roleClaim), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)         { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)     { return Forbid(); }
        catch (InvalidOperationException ex)    { return Conflict(new { error = ex.Message }); }
    }

    /// <summary>
    /// FS-29 — Immutable approval-chain audit trail: approval votes, claim history,
    /// routing events (loop-guard / reroutes) for a single incident.
    /// Accessible to APPROVER and ADMIN.
    /// </summary>
    [HttpGet("/api/v1/incidents/{id:guid}/approval-audit-trail")]
    [Authorize(Roles = "APPROVER,ADMIN")]
    public async Task<IActionResult> GetApprovalAuditTrail(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _mediator.Send(new GetApprovalAuditTrailQuery(id), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}

public record ApproveIncidentRequest(Guid ResolverUserId);
public record RejectIncidentRequest(RejectType RejectType, string Reason);
public record EscalateIncidentRequest(string Reason);
public record ReassignIncidentRequest(string NewCategory, int NewSeverity, string Reason);
public record MergeIncidentRequest(Guid PrimaryIncidentId, string Reason);
public record RequestInfoRequest(string Question);
