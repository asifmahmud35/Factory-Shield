using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IAdminRepository
{
    Task SaveChangesAsync(CancellationToken ct = default);

    // Roles
    Task<IReadOnlyList<Role>> GetRolesAsync(CancellationToken ct = default);
    Task<Role?> FindRoleByIdAsync(Guid id, CancellationToken ct = default);
    Task<Role?> FindRoleByCodeAsync(string code, CancellationToken ct = default);
    Task AddRoleAsync(Role role, CancellationToken ct = default);
    Task DeleteRoleAsync(Role role, CancellationToken ct = default);
    Task<int> CountUsersInRoleAsync(Guid roleId, CancellationToken ct = default);

    // Users
    Task<IReadOnlyList<User>> GetUsersAsync(CancellationToken ct = default);
    Task<User?> FindUserByIdAsync(Guid id, CancellationToken ct = default);

    // Categories
    Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken ct = default);
    Task<Category?> FindCategoryByIdAsync(Guid id, CancellationToken ct = default);
    Task AddCategoryAsync(Category category, CancellationToken ct = default);
    Task DeleteCategoryAsync(Category category, CancellationToken ct = default);

    // Departments
    Task<IReadOnlyList<Department>> GetDepartmentsAsync(CancellationToken ct = default);
    Task<Department?> FindDepartmentByIdAsync(Guid id, CancellationToken ct = default);
    Task AddDepartmentAsync(Department department, CancellationToken ct = default);
    Task DeleteDepartmentAsync(Department department, CancellationToken ct = default);

    // Severity / Priority
    Task<IReadOnlyList<SeverityLevel>> GetSeverityLevelsAsync(CancellationToken ct = default);
    Task<SeverityLevel?> FindSeverityLevelByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<PriorityLevel>> GetPriorityLevelsAsync(CancellationToken ct = default);
    Task<PriorityLevel?> FindPriorityLevelByIdAsync(Guid id, CancellationToken ct = default);

    // Factories / Lines
    Task<IReadOnlyList<Factory>> GetFactoriesAsync(CancellationToken ct = default);
    Task<Factory?> FindFactoryByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<ProductionLine>> GetLinesByFactoryIdAsync(Guid factoryId, CancellationToken ct = default);
    Task<ProductionLine?> FindLineByIdAsync(Guid lineId, CancellationToken ct = default);
    Task AddProductionLineAsync(ProductionLine line, CancellationToken ct = default);

    // Notification templates
    Task<IReadOnlyList<NotificationTemplate>> GetNotificationTemplatesAsync(CancellationToken ct = default);
    Task<NotificationTemplate?> FindNotificationTemplateByIdAsync(Guid id, CancellationToken ct = default);

    // Escalation rules / notification history
    Task<IReadOnlyList<EscalationRule>> GetEscalationRulesAsync(CancellationToken ct = default);
    Task<EscalationRule?> FindEscalationRuleByIdAsync(Guid id, CancellationToken ct = default);
    Task AddEscalationRuleAsync(EscalationRule rule, CancellationToken ct = default);
    Task DeleteEscalationRuleAsync(EscalationRule rule, CancellationToken ct = default);
    Task<IReadOnlyList<EscalationNotificationRecord>> GetEscalationNotificationsAsync(CancellationToken ct = default);
}
