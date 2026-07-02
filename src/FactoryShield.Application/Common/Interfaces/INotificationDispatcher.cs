namespace FactoryShield.Application.Common.Interfaces;

public record NotificationRequest(
    Guid? RecipientUserId,
    string? RecipientRole,
    string TriggerEvent,
    string Title,
    string Message,
    string? DeepLinkPath,
    Guid? IncidentId,
    string IdempotencyKey,
    string[] Channels
);

public interface INotificationDispatcher
{
    Task DispatchAsync(NotificationRequest request, CancellationToken ct = default);
}
