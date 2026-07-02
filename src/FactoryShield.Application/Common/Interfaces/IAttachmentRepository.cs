using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IAttachmentRepository
{
    Task<IReadOnlyList<Attachment>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct = default);
    Task AddAsync(Attachment attachment, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
