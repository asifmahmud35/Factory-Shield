using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FactoryShield.Application.Rca.Commands;
using FactoryShield.Application.Rca.Models;
using FactoryShield.Application.Rca.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Authorize]
public class RcaController : ControllerBase
{
    private readonly IMediator _mediator;

    public RcaController(IMediator mediator) => _mediator = mediator;

    [HttpGet("/api/v1/incidents/{id:guid}/rca")]
    [Authorize(Roles = "RESOLVER,ADMIN")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _mediator.Send(new GetRcaQuery(id), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("/api/v1/incidents/{id:guid}/rca/recommendations")]
    [Authorize(Policy = "ResolverOnly")]
    public async Task<IActionResult> GetRecommendations(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _mediator.Send(new GetRcaRecommendationsQuery(id), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("/api/v1/incidents/{id:guid}/rca/similar")]
    [Authorize(Policy = "ResolverOnly")]
    public async Task<IActionResult> GetSimilar(Guid id, CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(sub, out var resolverId))
            return Unauthorized();

        try
        {
            var result = await _mediator.Send(new GetSimilarIncidentsForRcaQuery(id, resolverId), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPut("/api/v1/incidents/{id:guid}/rca")]
    [Authorize(Policy = "ResolverOnly")]
    public async Task<IActionResult> Save(Guid id, [FromBody] SaveRcaRequest request, CancellationToken ct)
    {
        try
        {
            await _mediator.Send(new SaveRcaCommand(
                id,
                request.Method,
                request.ProblemStatement,
                request.WhyEntries,
                request.FishboneCategories,
                request.StructuredCategory,
                request.StructuredDescription,
                request.StructuredContributing,
                request.StructuredVerification,
                request.StructuredLessons,
                request.RootCauseStatement,
                request.ChecklistCompleted), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPost("/api/v1/incidents/{id:guid}/rca/submit")]
    [Authorize(Policy = "ResolverOnly")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        try
        {
            await _mediator.Send(new SubmitRcaCommand(id), ct);
            return Ok();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }
}

public record SaveRcaRequest(
    string? Method,
    string? ProblemStatement,
    IReadOnlyList<WhyEntryDto>? WhyEntries,
    FishboneCategoriesDto? FishboneCategories,
    string? StructuredCategory,
    string? StructuredDescription,
    string? StructuredContributing,
    string? StructuredVerification,
    string? StructuredLessons,
    string? RootCauseStatement,
    IReadOnlyList<string>? ChecklistCompleted
);
