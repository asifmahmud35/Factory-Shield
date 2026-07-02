using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface INotificationRepository
{
    Task<bool> ExistsAsync(Guid? incidentId, string stage, string type, CancellationToken ct = default);
    Task<bool> ExistsByIdempotencyKeyAsync(string key, CancellationToken ct = default);

    Task AddAsync(Notification notification, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);

    // FS-28: Notification system
    Task<Notification?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<(List<Notification> Items, int Total, int Unread)> GetPagedAsync(
        Guid userId, bool unreadOnly, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken ct = default);
    Task<List<Notification>> GetUnreadOlderThanAsync(DateTime threshold, CancellationToken ct = default);
}
