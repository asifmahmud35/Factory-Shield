using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Models;
using FactoryShield.Domain.Entities;
using FluentValidation;
using MediatR;

namespace FactoryShield.Application.Capa.Commands;

public record UploadActionEvidenceCommand(
    Guid ActionId,
    Stream FileContent,
    string FileName,
    string MimeType,
    Guid? UploadedBy
) : IRequest<UploadAttachmentResult>;

public class UploadActionEvidenceCommandHandler : IRequestHandler<UploadActionEvidenceCommand, UploadAttachmentResult>
{
    private readonly ICorrectiveActionRepository _actions;
    private readonly IAttachmentRepository _attachments;
    private readonly IFileStorageService _storage;

    public UploadActionEvidenceCommandHandler(
        ICorrectiveActionRepository actions,
        IAttachmentRepository attachments,
        IFileStorageService storage)
    {
        _actions = actions;
        _attachments = attachments;
        _storage = storage;
    }

    public async Task<UploadAttachmentResult> Handle(UploadActionEvidenceCommand request, CancellationToken cancellationToken)
    {
        if (request.FileContent.Length == 0)
            throw new ValidationException("File is required.");

        var action = await _actions.FindByIdAsync(request.ActionId, cancellationToken)
            ?? throw new KeyNotFoundException($"Corrective action {request.ActionId} not found.");

        var stored = await _storage.SaveAsync(request.FileContent, request.FileName, request.MimeType, cancellationToken);

        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            IncidentId = action.IncidentId,
            CorrectiveActionId = action.Id,
            AttachmentType = "capa_evidence",
            UploadStatus = "UPLOADED",
            MimeType = request.MimeType,
            FileSize = stored.FileSize,
            StorageKey = stored.StorageKey,
            Sha256Hash = stored.Sha256Hash,
            UploadedBy = request.UploadedBy,
            UploadedAt = DateTime.UtcNow,
            EvidenceNote = $"Evidence for CAPA: {action.Title}"
        };

        await _attachments.AddAsync(attachment, cancellationToken);
        await _attachments.SaveChangesAsync(cancellationToken);

        return new UploadAttachmentResult(attachment.Id);
    }
}
