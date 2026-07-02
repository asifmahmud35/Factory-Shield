using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _db;

    public NotificationRepository(AppDbContext db) => _db = db;

    public Task<bool> ExistsAsync(Guid? incidentId, string stage, string type, CancellationToken ct = default) =>
        _db.Notifications.AnyAsync(
            n => n.IncidentId == incidentId && n.Stage == stage && n.Type == type, ct);

    public Task<bool> ExistsByIdempotencyKeyAsync(string key, CancellationToken ct = default) =>
        _db.Notifications.AnyAsync(n => n.IdempotencyKey == key, ct);

    public async Task AddAsync(Notification notification, CancellationToken ct = default) =>
        await _db.Notifications.AddAsync(notification, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);

    public Task<Notification?> FindByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Notifications.FirstOrDefaultAsync(n => n.Id == id, ct);

    /// <summary>
    /// A notification belongs to a user if addressed to them directly (RecipientId), or
    /// broadcast to a role (RecipientId null, RecipientRole set) that they currently hold.
    /// Without the role-broadcast half, every role-targeted notification (SLA warnings with
    /// no assignee yet, escalation-exhausted fallback, new-incident digests, etc.) would be
    /// persisted but never surfaced to anyone.
    /// </summary>
    private async Task<string?> GetRoleCodeAsync(Guid userId, CancellationToken ct) =>
        await _db.Users.Where(u => u.Id == userId).Select(u => u.Role.Code).FirstOrDefaultAsync(ct);

    public async Task<(List<Notification> Items, int Total, int Unread)> GetPagedAsync(
        Guid userId, bool unreadOnly, int page, int pageSize, CancellationToken ct = default)
    {
        var role = await GetRoleCodeAsync(userId, ct);
        var q = _db.Notifications
            .Where(n => n.RecipientId == userId || (n.RecipientId == null && n.RecipientRole == role))
            .AsQueryable();

        if (unreadOnly) q = q.Where(n => !n.IsRead);

        var total = await q.CountAsync(ct);
        var unread = await _db.Notifications.CountAsync(
            n => (n.RecipientId == userId || (n.RecipientId == null && n.RecipientRole == role)) && !n.IsRead, ct);

        var items = await q
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total, unread);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
    {
        var role = await GetRoleCodeAsync(userId, ct);
        return await _db.Notifications.CountAsync(
            n => (n.RecipientId == userId || (n.RecipientId == null && n.RecipientRole == role)) && !n.IsRead, ct);
    }

    public async Task MarkAllReadAsync(Guid userId, CancellationToken ct = default)
    {
        var role = await GetRoleCodeAsync(userId, ct);
        var now = DateTime.UtcNow;
        await _db.Notifications
            .Where(n => (n.RecipientId == userId || (n.RecipientId == null && n.RecipientRole == role)) && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, now), ct);
    }

    public Task<List<Notification>> GetUnreadOlderThanAsync(DateTime threshold, CancellationToken ct = default) =>
        _db.Notifications
            .Where(n => n.Channel == "InApp" && !n.IsRead && !n.ReminderSent && n.CreatedAt < threshold)
            .ToListAsync(ct);
}
