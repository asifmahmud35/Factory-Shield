using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IOfflineDraftRepository
{
    Task<OfflineDraft?> FindByHashAsync(Guid reporterId, string payloadHash, CancellationToken ct);
    Task<OfflineDraft?> FindByLocalDraftIdAsync(Guid reporterId, string localDraftId, CancellationToken ct);
    Task<List<OfflineDraft>> GetByReporterIdAsync(Guid reporterId, CancellationToken ct);
    Task AddAsync(OfflineDraft draft, CancellationToken ct);
    Task<List<OfflineDraft>> GetStaleDraftsAsync(DateTime olderThan, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}
