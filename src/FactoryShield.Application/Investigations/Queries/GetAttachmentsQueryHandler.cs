using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Investigations.Queries;

public class GetAttachmentsQueryHandler : IRequestHandler<GetAttachmentsQuery, IReadOnlyList<AttachmentDto>>
{
    private readonly IAttachmentRepository _attachments;

    public GetAttachmentsQueryHandler(IAttachmentRepository attachments)
        => _attachments = attachments;

    public async Task<IReadOnlyList<AttachmentDto>> Handle(
        GetAttachmentsQuery request, CancellationToken cancellationToken)
    {
        var attachments = await _attachments.GetByIncidentIdAsync(request.IncidentId, cancellationToken);

        return attachments.Select(a => new AttachmentDto(
            a.Id,
            a.MimeType,
            a.StorageKey,
            a.EvidenceNote,
            a.Uploader?.Name,
            a.UploadedAt,
            a.CorrectiveActionId
        )).ToList();
    }
}
