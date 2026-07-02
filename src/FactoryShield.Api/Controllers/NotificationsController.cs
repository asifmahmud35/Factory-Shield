using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FactoryShield.Application.Notifications.Commands;
using FactoryShield.Application.Notifications.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator) => _mediator = mediator;

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    /// <summary>Paged notifications for the current user. ?unreadOnly=true&amp;page=1&amp;pageSize=20</summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var result = await _mediator.Send(
            new GetNotificationsQuery(userId.Value, unreadOnly, page, pageSize), ct);

        return Ok(new
        {
            items = result.Items,
            totalCount = result.TotalCount,
            unreadCount = result.UnreadCount,
            page,
            pageSize
        });
    }

    /// <summary>Unread count badge — polled every 60s by the frontend.</summary>
    [HttpGet("count")]
    public async Task<IActionResult> GetCount(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var count = await _mediator.Send(new GetNotificationCountQuery(userId.Value), ct);
        return Ok(new { unreadCount = count });
    }

    /// <summary>Mark a single notification as read.</summary>
    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        await _mediator.Send(new MarkNotificationReadCommand(id, userId.Value), ct);
        return Ok();
    }

    /// <summary>Mark all notifications as read for the current user.</summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        await _mediator.Send(new MarkAllNotificationsReadCommand(userId.Value), ct);
        return Ok();
    }
}
