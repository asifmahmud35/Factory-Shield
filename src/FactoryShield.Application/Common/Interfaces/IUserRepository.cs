using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> FindByEmailWithRoleAsync(string email, CancellationToken ct = default);
    Task<User?> FindByIdWithRoleAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<User>> GetByRoleAsync(string roleCode, CancellationToken ct = default);
}
