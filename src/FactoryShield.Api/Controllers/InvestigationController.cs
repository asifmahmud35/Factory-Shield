using FactoryShield.Application.Investigations.Commands;
using FactoryShield.Application.Investigations.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Authorize(Policy = "ResolverOnly")]
public class InvestigationController : ControllerBase
{
    private readonly IMediator _mediator;

    public InvestigationController(IMediator mediator) => _mediator = mediator;

    [HttpPost("/api/v1/incidents/{id:guid}/investigation")]
    public async Task<IActionResult> Open(Guid id, CancellationToken ct)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid identity in token." });

        try
        {
            var investigationId = await _mediator.Send(new OpenInvestigationCommand(id, userId), ct);
            return Ok(new { investigationId });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("/api/v1/incidents/{id:guid}/investigation")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _mediator.Send(new GetInvestigationQuery(id), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("/api/v1/incidents/{id:guid}/investigation")]
    public async Task<IActionResult> Save(Guid id, [FromBody] SaveInvestigationRequest request, CancellationToken ct)
    {
        try
        {
            await _mediator.Send(new SaveInvestigationCommand(
                id,
                request.Owner,
                request.InvestigationDate,
                request.TargetCompletionDate,
                request.RiskLevel,
                request.Notes,
                request.FindingsSummary,
                request.ImmediateActionTaken,
                request.LessonsLearned,
                request.RootCauseCode,
                request.RootCauseDescription), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/investigation/block")]
    public async Task<IActionResult> Block(Guid id, [FromBody] BlockInvestigationRequest request, CancellationToken ct)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdClaim, out var actorId))
            return Unauthorized(new { error = "Invalid identity in token." });

        try
        {
            await _mediator.Send(new SetInvestigationBlockedCommand(id, actorId, request.BlockReason), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/investigation/checklist/{itemId:guid}/toggle")]
    public async Task<IActionResult> ToggleChecklist(Guid id, Guid itemId, CancellationToken ct)
    {
        try
        {
            var result = await _mediator.Send(new ToggleChecklistItemCommand(id, itemId), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

}

public record SaveInvestigationRequest(
    string? Owner,
    DateTime? InvestigationDate,
    DateTime? TargetCompletionDate,
    string? RiskLevel,
    string? Notes,
    string? FindingsSummary,
    string? ImmediateActionTaken,
    string? LessonsLearned,
    string? RootCauseCode = null,
    string? RootCauseDescription = null
);

public record BlockInvestigationRequest(string BlockReason);
