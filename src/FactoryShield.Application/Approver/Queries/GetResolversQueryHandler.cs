using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Approver.Queries;

public class GetResolversQueryHandler : IRequestHandler<GetResolversQuery, IReadOnlyList<ResolverDto>>
{
    private readonly IUserRepository _users;

    public GetResolversQueryHandler(IUserRepository users) => _users = users;

    public async Task<IReadOnlyList<ResolverDto>> Handle(GetResolversQuery request, CancellationToken cancellationToken)
    {
        var resolvers = await _users.GetByRoleAsync("RESOLVER", cancellationToken);
        return resolvers.Select(u => new ResolverDto(u.Id, u.Name, u.Email)).ToList();
    }
}
