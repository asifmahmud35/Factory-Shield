using MediatR;

namespace FactoryShield.Application.Investigations.Queries;

public record AttachmentDto(
    Guid Id,
    string MimeType,
    string StorageKey,
    string? EvidenceNote,
    string? UploaderName,
    DateTime UploadedAt,
    Guid? CorrectiveActionId
);

public record GetAttachmentsQuery(Guid IncidentId) : IRequest<IReadOnlyList<AttachmentDto>>;
