using System.Text.Json;
using FactoryShield.Application.Approver.Queries;
using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/escalations")]
public class EscalationController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly IAdminRepository _admin;
    private readonly IMediator _mediator;

    public EscalationController(IAdminRepository admin, IMediator mediator)
    {
        _admin = admin;
        _mediator = mediator;
    }

    [HttpGet("active")]
    [Authorize(Roles = "APPROVER,ADMIN")]
    public async Task<IActionResult> GetActive(CancellationToken ct) =>
        Ok(await _mediator.Send(new GetActiveEscalationsQuery(), ct));

    [HttpGet("rules")]
    [Authorize(Roles = "APPROVER,ADMIN")]
    public async Task<IActionResult> GetRules(CancellationToken ct) =>
        Ok((await _admin.GetEscalationRulesAsync(ct)).Select(r => new
        {
            r.Id,
            r.Name,
            r.Description,
            r.TriggerAfterMinutes,
            channels = ParseJsonArray(r.ChannelsJson),
            recipients = ParseJsonArray(r.RecipientsJson),
            r.Active
        }));

    [HttpPost("rules")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> CreateRule([FromBody] CreateEscalationRuleRequest req, CancellationToken ct)
    {
        var rule = new EscalationRule
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Description = req.Description,
            TriggerAfterMinutes = req.TriggerAfterMinutes,
            ChannelsJson = SerializeJson(req.Channels ?? []),
            RecipientsJson = SerializeJson(req.Recipients ?? []),
            Active = req.Active ?? true
        };
        await _admin.AddEscalationRuleAsync(rule, ct);
        await _admin.SaveChangesAsync(ct);
        return StatusCode(201, new { rule.Id, rule.Name });
    }

    [HttpPut("rules/{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateRule(Guid id, [FromBody] UpdateEscalationRuleRequest req, CancellationToken ct)
    {
        var rule = await _admin.FindEscalationRuleByIdAsync(id, ct);
        if (rule is null) return NotFound();

        if (req.Name is not null) rule.Name = req.Name;
        if (req.Description is not null) rule.Description = req.Description;
        if (req.TriggerAfterMinutes.HasValue) rule.TriggerAfterMinutes = req.TriggerAfterMinutes.Value;
        if (req.Channels is not null) rule.ChannelsJson = SerializeJson(req.Channels);
        if (req.Recipients is not null) rule.RecipientsJson = SerializeJson(req.Recipients);
        if (req.Active.HasValue) rule.Active = req.Active.Value;

        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("rules/{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteRule(Guid id, CancellationToken ct)
    {
        var rule = await _admin.FindEscalationRuleByIdAsync(id, ct);
        if (rule is null) return NotFound();

        await _admin.DeleteEscalationRuleAsync(rule, ct);
        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpGet("notifications")]
    [Authorize(Roles = "APPROVER,ADMIN")]
    public async Task<IActionResult> GetNotifications(CancellationToken ct) =>
        Ok((await _admin.GetEscalationNotificationsAsync(ct)).Select(n => new
        {
            n.Id,
            n.IncidentReference,
            ruleName = n.RuleName,
            via = n.Via,
            n.Recipients,
            sentAt = n.SentAt,
            n.Status
        }));

    private static List<string> ParseJsonArray(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json, JsonOpts) ?? []; }
        catch { return []; }
    }

    private static string SerializeJson(IReadOnlyList<string> values) =>
        JsonSerializer.Serialize(values, JsonOpts);
}

public record CreateEscalationRuleRequest(
    string Name,
    string? Description,
    int TriggerAfterMinutes,
    IReadOnlyList<string>? Channels,
    IReadOnlyList<string>? Recipients,
    bool? Active
);

public record UpdateEscalationRuleRequest(
    string? Name,
    string? Description,
    int? TriggerAfterMinutes,
    IReadOnlyList<string>? Channels,
    IReadOnlyList<string>? Recipients,
    bool? Active
);
