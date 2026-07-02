using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly AppDbContext _db;

    public AdminRepository(AppDbContext db) => _db = db;

    public Task SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);

    public async Task<IReadOnlyList<Role>> GetRolesAsync(CancellationToken ct = default) =>
        await _db.Roles.OrderBy(r => r.Code).ToListAsync(ct);

    public Task<Role?> FindRoleByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Roles.FirstOrDefaultAsync(r => r.Id == id, ct);

    public Task<Role?> FindRoleByCodeAsync(string code, CancellationToken ct = default) =>
        _db.Roles.FirstOrDefaultAsync(r => r.Code == code, ct);

    public async Task AddRoleAsync(Role role, CancellationToken ct = default) =>
        await _db.Roles.AddAsync(role, ct);

    public Task DeleteRoleAsync(Role role, CancellationToken ct = default)
    {
        _db.Roles.Remove(role);
        return Task.CompletedTask;
    }

    public Task<int> CountUsersInRoleAsync(Guid roleId, CancellationToken ct = default) =>
        _db.Users.CountAsync(u => u.RoleId == roleId, ct);

    public async Task<IReadOnlyList<User>> GetUsersAsync(CancellationToken ct = default) =>
        await _db.Users.Include(u => u.Role).OrderBy(u => u.Name).ToListAsync(ct);

    public Task<User?> FindUserByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken ct = default) =>
        await _db.Categories.OrderBy(c => c.Name).ToListAsync(ct);

    public Task<Category?> FindCategoryByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddCategoryAsync(Category category, CancellationToken ct = default) =>
        await _db.Categories.AddAsync(category, ct);

    public Task DeleteCategoryAsync(Category category, CancellationToken ct = default)
    {
        _db.Categories.Remove(category);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<Department>> GetDepartmentsAsync(CancellationToken ct = default) =>
        await _db.Departments.OrderBy(d => d.Name).ToListAsync(ct);

    public Task<Department?> FindDepartmentByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Departments.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task AddDepartmentAsync(Department department, CancellationToken ct = default) =>
        await _db.Departments.AddAsync(department, ct);

    public Task DeleteDepartmentAsync(Department department, CancellationToken ct = default)
    {
        _db.Departments.Remove(department);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<SeverityLevel>> GetSeverityLevelsAsync(CancellationToken ct = default) =>
        await _db.SeverityLevels.OrderBy(s => s.SeverityValue).ToListAsync(ct);

    public Task<SeverityLevel?> FindSeverityLevelByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.SeverityLevels.FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<IReadOnlyList<PriorityLevel>> GetPriorityLevelsAsync(CancellationToken ct = default) =>
        await _db.PriorityLevels.OrderBy(p => p.PriorityValue).ToListAsync(ct);

    public Task<PriorityLevel?> FindPriorityLevelByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.PriorityLevels.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<Factory>> GetFactoriesAsync(CancellationToken ct = default) =>
        await _db.Factories.OrderBy(f => f.Name).ToListAsync(ct);

    public Task<Factory?> FindFactoryByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Factories.FirstOrDefaultAsync(f => f.Id == id, ct);

    public async Task<IReadOnlyList<ProductionLine>> GetLinesByFactoryIdAsync(Guid factoryId, CancellationToken ct = default) =>
        await _db.ProductionLines.Where(l => l.FactoryId == factoryId).OrderBy(l => l.Name).ToListAsync(ct);

    public Task<ProductionLine?> FindLineByIdAsync(Guid lineId, CancellationToken ct = default) =>
        _db.ProductionLines.FirstOrDefaultAsync(l => l.Id == lineId, ct);

    public async Task AddProductionLineAsync(ProductionLine line, CancellationToken ct = default) =>
        await _db.ProductionLines.AddAsync(line, ct);

    public async Task<IReadOnlyList<NotificationTemplate>> GetNotificationTemplatesAsync(CancellationToken ct = default) =>
        await _db.NotificationTemplates.OrderBy(t => t.TriggerEvent).ToListAsync(ct);

    public Task<NotificationTemplate?> FindNotificationTemplateByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.NotificationTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<IReadOnlyList<EscalationRule>> GetEscalationRulesAsync(CancellationToken ct = default) =>
        await _db.EscalationRules.OrderBy(r => r.Name).ToListAsync(ct);

    public Task<EscalationRule?> FindEscalationRuleByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.EscalationRules.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task AddEscalationRuleAsync(EscalationRule rule, CancellationToken ct = default) =>
        await _db.EscalationRules.AddAsync(rule, ct);

    public Task DeleteEscalationRuleAsync(EscalationRule rule, CancellationToken ct = default)
    {
        _db.EscalationRules.Remove(rule);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<EscalationNotificationRecord>> GetEscalationNotificationsAsync(CancellationToken ct = default) =>
        await _db.EscalationNotificationRecords.OrderByDescending(n => n.SentAt).Take(200).ToListAsync(ct);
}
