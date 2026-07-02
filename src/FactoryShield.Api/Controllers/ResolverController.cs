using FactoryShield.Application.Capa.Commands;
using FactoryShield.Application.Capa.Queries;
using FactoryShield.Application.Resolver.Commands;
using FactoryShield.Application.Resolver.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/resolver")]
[Authorize(Policy = "ResolverOnly")]
public class ResolverController : ControllerBase
{
    private readonly IMediator _mediator;

    public ResolverController(IMediator mediator) => _mediator = mediator;

    [HttpGet("assigned")]
    public async Task<IActionResult> GetAssigned(CancellationToken ct)
    {
        var resolverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(resolverIdClaim, out var resolverId))
            return Unauthorized(new { error = "Invalid resolver identity in token." });

        var result = await _mediator.Send(new GetAssignedIncidentsQuery(resolverId), ct);
        return Ok(result);
    }

    [HttpGet("/api/v1/incidents/{id:guid}/actions")]
    public async Task<IActionResult> GetActions(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCorrectiveActionsQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("/api/v1/incidents/{id:guid}/actions")]
    public async Task<IActionResult> CreateAction(Guid id, [FromBody] CreateActionRequest req, CancellationToken ct)
    {
        try
        {
            var actionId = await _mediator.Send(
                new CreateCorrectiveActionCommand(id, req.Title, req.Description, req.Owner, req.DueDate, req.Priority), ct);
            return StatusCode(201, new { actionId });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPatch("/api/v1/actions/{actionId:guid}")]
    public async Task<IActionResult> UpdateAction(Guid actionId, [FromBody] UpdateActionRequest req, CancellationToken ct)
    {
        var resolverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        Guid.TryParse(resolverIdClaim, out var actorId);

        try
        {
            await _mediator.Send(
                new UpdateCorrectiveActionCommand(actionId, req.CompletionPercentage, req.Status, req.VerifiedBy, req.Owner, req.DueDate,
                    actorId == Guid.Empty ? null : actorId), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("/api/v1/actions/{actionId:guid}/evidence")]
    public async Task<IActionResult> UploadEvidence(Guid actionId, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "File is required." });

        var resolverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        Guid.TryParse(resolverIdClaim, out var uploadedBy);

        try
        {
            await using var stream = file.OpenReadStream();
            var result = await _mediator.Send(new UploadActionEvidenceCommand(
                actionId, stream, file.FileName, file.ContentType,
                uploadedBy == Guid.Empty ? null : uploadedBy), ct);
            return StatusCode(201, new { attachmentId = result.AttachmentId });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (FluentValidation.ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("/api/v1/actions/{actionId:guid}/complete")]
    public async Task<IActionResult> CompleteAction(Guid actionId, CancellationToken ct)
    {
        var resolverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        Guid.TryParse(resolverIdClaim, out var actorId);

        try
        {
            await _mediator.Send(new CompleteCorrectiveActionCommand(
                actionId, actorId == Guid.Empty ? null : actorId), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/resolve")]
    public async Task<IActionResult> ResolveIncident(Guid id, CancellationToken ct)
    {
        var resolverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        Guid.TryParse(resolverIdClaim, out var resolverId);

        try
        {
            await _mediator.Send(new ResolveIncidentCommand(id, resolverId == Guid.Empty ? null : resolverId), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public record CreateActionRequest(
    string Title,
    string? Description,
    string? Owner,
    DateTime? DueDate,
    int Priority = 3
);

public record UpdateActionRequest(
    int? CompletionPercentage,
    string? Status,
    string? VerifiedBy,
    string? Owner,
    DateTime? DueDate
);
