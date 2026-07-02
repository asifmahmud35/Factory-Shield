using FactoryShield.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace FactoryShield.Infrastructure.Realtime;

public class SignalRNotificationPusher : INotificationPusher
{
    private readonly IHubContext<NotificationHub> _hub;

    public SignalRNotificationPusher(IHubContext<NotificationHub> hub) => _hub = hub;

    public Task PushToUserAsync(Guid userId, NotificationPushDto payload, CancellationToken ct = default)
        => _hub.Clients
            .Group(NotificationHub.GroupNameFor(userId))
            .SendAsync("notificationReceived", payload, ct);
}
