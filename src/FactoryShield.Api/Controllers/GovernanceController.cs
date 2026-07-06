using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FactoryShield.Application.Governance.Commands;
using FactoryShield.Application.Governance.Queries;
using FactoryShield.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize(Policy = "GovernanceOnly")]
public class GovernanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public GovernanceController(IMediator mediator) => _mediator = mediator;

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private string GetCurrentRole() =>
        User.FindFirstValue(ClaimTypes.Role) ?? "UNKNOWN";

    [HttpGet("approvals/pending")]
    public async Task<IActionResult> GetPendingApprovals(CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        var result = await _mediator.Send(new GetPendingApprovalsQuery(actorId.Value), ct);
        return Ok(result);
    }

    [HttpPost("approvals/{incidentId:guid}")]
    public async Task<IActionResult> SubmitApproval(
        Guid incidentId,
        [FromBody] SubmitApprovalRequest request,
        CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();

        try
        {
            var result = await _mediator.Send(new SubmitApprovalCommand(
                incidentId,
                request.ApprovalType,
                request.IsApprove,
                request.RejectionReason,
                actorId.Value), ct);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)        { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex)   { return Conflict(new { error = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { error = ex.Message }); }
        catch (ArgumentException ex)           { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("dashboard/executive")]
    public async Task<IActionResult> ExecutiveDashboard(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new GetExecutiveDashboardQuery(from, to), ct);
        return Ok(result);
    }

    [HttpGet("incidents/{incidentId:guid}/timeline")]
    [Authorize]
    public async Task<IActionResult> GetTimeline(Guid incidentId, CancellationToken ct)
    {
        var callerRole = GetCurrentRole();
        try
        {
            var result = await _mediator.Send(new GetIncidentTimelineQuery(incidentId, callerRole), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("incidents/{incidentId:guid}/unmask-reporter")]
    public async Task<IActionResult> UnmaskReporter(
        Guid incidentId,
        [FromBody] UnmaskReporterRequest request,
        CancellationToken ct)
    {
        var actorId = GetCurrentUserId();
        if (actorId is null) return Unauthorized();
        var role = GetCurrentRole();

        try
        {
            var email = await _mediator.Send(
                new UnmaskReporterIdentityCommand(incidentId, actorId.Value, role, request.Reason), ct);
            return Ok(new { reporterEmail = email });
        }
        catch (KeyNotFoundException ex)        { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { error = ex.Message }); }
    }
}

public record SubmitApprovalRequest(ApprovalType ApprovalType, bool IsApprove, string? RejectionReason);
public record UnmaskReporterRequest(string Reason);
