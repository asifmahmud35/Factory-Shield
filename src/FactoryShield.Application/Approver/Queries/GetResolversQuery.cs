using MediatR;

namespace FactoryShield.Application.Approver.Queries;

public record ResolverDto(Guid Id, string Name, string Email);

public record GetResolversQuery : IRequest<IReadOnlyList<ResolverDto>>;
