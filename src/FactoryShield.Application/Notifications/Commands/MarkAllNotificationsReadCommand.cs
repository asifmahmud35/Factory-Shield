using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Notifications.Commands;

public record MarkAllNotificationsReadCommand(Guid UserId) : IRequest;

public class MarkAllNotificationsReadCommandHandler : IRequestHandler<MarkAllNotificationsReadCommand>
{
    private readonly INotificationRepository _repo;

    public MarkAllNotificationsReadCommandHandler(INotificationRepository repo) => _repo = repo;

    public async Task Handle(MarkAllNotificationsReadCommand request, CancellationToken ct)
    {
        await _repo.MarkAllReadAsync(request.UserId, ct);
    }
}
