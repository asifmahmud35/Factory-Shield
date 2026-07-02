using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) => _db = db;

    public Task<User?> FindByEmailWithRoleAsync(string email, CancellationToken ct = default) =>
        _db.Users
           .Include(u => u.Role)
           .FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<User?> FindByIdWithRoleAsync(Guid id, CancellationToken ct = default) =>
        _db.Users
           .Include(u => u.Role)
           .FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<IReadOnlyList<User>> GetByRoleAsync(string roleCode, CancellationToken ct = default) =>
        await _db.Users
           .Include(u => u.Role)
           .Where(u => u.Role.Code == roleCode)
           .OrderBy(u => u.Name)
           .ToListAsync(ct);
}
