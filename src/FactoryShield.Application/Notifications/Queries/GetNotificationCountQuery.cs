using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Notifications.Queries;

public record GetNotificationCountQuery(Guid UserId) : IRequest<int>;

public class GetNotificationCountQueryHandler : IRequestHandler<GetNotificationCountQuery, int>
{
    private readonly INotificationRepository _repo;

    public GetNotificationCountQueryHandler(INotificationRepository repo) => _repo = repo;

    public Task<int> Handle(GetNotificationCountQuery request, CancellationToken ct)
        => _repo.GetUnreadCountAsync(request.UserId, ct);
}
