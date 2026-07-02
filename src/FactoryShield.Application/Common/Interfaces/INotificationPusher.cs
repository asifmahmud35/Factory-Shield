namespace FactoryShield.Application.Common.Interfaces;

public record NotificationPushDto(
    Guid Id,
    string Type,
    string Subject,
    string Body,
    string? DeepLinkPath,
    Guid? IncidentId,
    DateTime CreatedAt,
    int UnreadCount
);

public interface INotificationPusher
{
    Task PushToUserAsync(Guid userId, NotificationPushDto payload, CancellationToken ct = default);
}
