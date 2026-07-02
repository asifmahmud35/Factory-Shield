using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace FactoryShield.Infrastructure.Services;

public class NotificationDispatcher : INotificationDispatcher
{
    private readonly INotificationRepository _repo;
    private readonly IEmailService _email;
    private readonly ISmsService _sms;
    private readonly IUserRepository _users;
    private readonly IIncidentClaimRepository _claims;
    private readonly INotificationPusher _pusher;
    private readonly ILogger<NotificationDispatcher> _logger;

    private static readonly HashSet<string> SuppressIfActivelyViewing = new(StringComparer.OrdinalIgnoreCase)
    {
        "SLA_WARNING", "SLA_CRITICAL", "SLA_BREACH", "ASSIGNMENT", "ESCALATION"
    };

    public NotificationDispatcher(
        INotificationRepository repo,
        IEmailService email,
        ISmsService sms,
        IUserRepository users,
        IIncidentClaimRepository claims,
        INotificationPusher pusher,
        ILogger<NotificationDispatcher> logger)
    {
        _repo = repo;
        _email = email;
        _sms = sms;
        _users = users;
        _claims = claims;
        _pusher = pusher;
        _logger = logger;
    }

    public async Task DispatchAsync(NotificationRequest request, CancellationToken ct = default)
    {
        if (await ShouldSuppressForActiveViewerAsync(request, ct))
        {
            _logger.LogDebug(
                "Suppressed {Event} for active viewer on incident {IncidentId}.",
                request.TriggerEvent, request.IncidentId);
            return;
        }

        // Idempotency check — never send the same notification twice
        if (!string.IsNullOrEmpty(request.IdempotencyKey))
        {
            if (await _repo.ExistsByIdempotencyKeyAsync(request.IdempotencyKey, ct))
            {
                _logger.LogDebug("Notification {Key} already dispatched — skipping.", request.IdempotencyKey);
                return;
            }
        }

        var channels = request.Channels.Length > 0 ? request.Channels : ["InApp"];

        // Resolve recipient email/phone for external channels
        string? recipientEmail = null;
        if (request.RecipientUserId.HasValue && (channels.Contains("Email") || channels.Contains("SMS")))
        {
            var user = await _users.FindByIdWithRoleAsync(request.RecipientUserId.Value, ct);
            recipientEmail = user?.Email;
        }

        // 1. InApp — always first
        if (channels.Contains("InApp"))
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                IncidentId = request.IncidentId,
                RecipientId = request.RecipientUserId,
                RecipientRole = request.RecipientRole,
                Type = request.TriggerEvent,
                Stage = request.TriggerEvent,
                Channel = "InApp",
                Subject = request.Title,
                Body = request.Message,
                DeepLinkPath = request.DeepLinkPath,
                TriggerEvent = request.TriggerEvent,
                IdempotencyKey = request.IdempotencyKey,
                DeliveryStatus = "Sent",
                SentAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
            };
            await _repo.AddAsync(notification, ct);
            await _repo.SaveChangesAsync(ct);

            if (request.RecipientUserId.HasValue)
            {
                var unreadCount = await _repo.GetUnreadCountAsync(request.RecipientUserId.Value, ct);
                await _pusher.PushToUserAsync(
                    request.RecipientUserId.Value,
                    new NotificationPushDto(
                        notification.Id,
                        notification.Type,
                        notification.Subject,
                        notification.Body,
                        notification.DeepLinkPath,
                        notification.IncidentId,
                        notification.CreatedAt,
                        unreadCount),
                    ct);
            }
        }

        // 2. Email — async, after InApp
        if (channels.Contains("Email") && !string.IsNullOrEmpty(recipientEmail))
        {
            try
            {
                var body = BuildEmailBody(request);
                await _email.SendAsync(new EmailMessage(
                    To: recipientEmail,
                    Subject: request.Title,
                    Body: body,
                    DeepLinkUrl: request.DeepLinkPath
                ), ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Email dispatch failed for {Key}", request.IdempotencyKey);
            }
        }

        // 3. SMS — last, only for urgent events
        if (channels.Contains("SMS") && !string.IsNullOrEmpty(recipientEmail))
        {
            try
            {
                var smsBody = $"FactoryShield: {request.Title}. Ref: {request.IncidentId?.ToString()[..8]}";
                if (smsBody.Length > 160) smsBody = smsBody[..157] + "...";
                await _sms.SendAsync(recipientEmail, smsBody, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMS dispatch failed for {Key}", request.IdempotencyKey);
            }
        }
    }

    private static string BuildEmailBody(NotificationRequest request)
    {
        var deepLink = request.DeepLinkPath ?? "#";
        return $"""
            {request.Message}

            View incident: {deepLink}

            ---
            CONFIDENTIAL — iFar-Silexa (Pvt.) Ltd.
            This message was generated by FactoryShield Incident Management System.
            Do not reply to this email.
            """;
    }

    private async Task<bool> ShouldSuppressForActiveViewerAsync(
        NotificationRequest request, CancellationToken ct)
    {
        if (!request.IncidentId.HasValue || !request.RecipientUserId.HasValue)
            return false;

        if (string.IsNullOrEmpty(request.TriggerEvent)
            || !SuppressIfActivelyViewing.Contains(request.TriggerEvent))
            return false;

        var claim = await _claims.GetActiveByIncidentIdAsync(request.IncidentId.Value, ct);
        return claim is not null
            && claim.IsActive
            && claim.ClaimedById == request.RecipientUserId.Value;
    }
}
