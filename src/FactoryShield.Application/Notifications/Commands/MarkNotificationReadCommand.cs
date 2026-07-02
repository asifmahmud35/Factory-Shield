using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Notifications.Commands;

public record MarkNotificationReadCommand(Guid NotificationId, Guid UserId) : IRequest;

public class MarkNotificationReadCommandHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly INotificationRepository _repo;

    public MarkNotificationReadCommandHandler(INotificationRepository repo) => _repo = repo;

    public async Task Handle(MarkNotificationReadCommand request, CancellationToken ct)
    {
        var notification = await _repo.FindByIdAsync(request.NotificationId, ct);
        if (notification is null || notification.RecipientId != request.UserId) return;

        if (notification.IsRead) return;

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _repo.SaveChangesAsync(ct);
    }
}
