using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Notifications.Queries;

public record NotificationDto(
    Guid Id,
    string Type,
    string Stage,
    string? Subject,
    string? Body,
    string? Channel,
    string? DeepLinkPath,
    string? TriggerEvent,
    bool IsRead,
    DateTime CreatedAt,
    DateTime? SentAt,
    DateTime? ReadAt
);

public record GetNotificationsQuery(
    Guid UserId,
    bool UnreadOnly = false,
    int Page = 1,
    int PageSize = 20
) : IRequest<GetNotificationsResult>;

public record GetNotificationsResult(List<NotificationDto> Items, int TotalCount, int UnreadCount);

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, GetNotificationsResult>
{
    private readonly INotificationRepository _repo;

    public GetNotificationsQueryHandler(INotificationRepository repo) => _repo = repo;

    public async Task<GetNotificationsResult> Handle(GetNotificationsQuery request, CancellationToken ct)
    {
        var (items, total, unread) = await _repo.GetPagedAsync(
            request.UserId, request.UnreadOnly, request.Page, request.PageSize, ct);

        var dtos = items.Select(n => new NotificationDto(
            n.Id, n.Type, n.Stage, n.Subject, n.Body, n.Channel,
            n.DeepLinkPath, n.TriggerEvent, n.IsRead,
            n.CreatedAt, n.SentAt, n.ReadAt)).ToList();

        return new GetNotificationsResult(dtos, total, unread);
    }
}
