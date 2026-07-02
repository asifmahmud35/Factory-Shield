using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Models;
using FactoryShield.Domain.Entities;
using FluentValidation;
using MediatR;

namespace FactoryShield.Application.Incidents.Commands;

public class UploadAttachmentCommandHandler : IRequestHandler<UploadAttachmentCommand, UploadAttachmentResult>
{
    private readonly IIncidentRepository _incidents;
    private readonly IAttachmentRepository _attachments;
    private readonly IFileStorageService _storage;
    private readonly IValidator<UploadAttachmentCommand> _validator;

    public UploadAttachmentCommandHandler(
        IIncidentRepository incidents,
        IAttachmentRepository attachments,
        IFileStorageService storage,
        IValidator<UploadAttachmentCommand> validator)
    {
        _incidents = incidents;
        _attachments = attachments;
        _storage = storage;
        _validator = validator;
    }

    public async Task<UploadAttachmentResult> Handle(UploadAttachmentCommand request, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            throw new ValidationException(validation.Errors);

        var incident = await _incidents.FindByIdAsync(request.IncidentId, cancellationToken);
        if (incident is null)
            throw new KeyNotFoundException($"Incident '{request.IncidentId}' not found.");

        var stored = await _storage.SaveAsync(request.FileContent, request.FileName, request.MimeType, cancellationToken);

        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            IncidentId = request.IncidentId,
            AttachmentType = request.MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ? "photo" : "document",
            UploadStatus = "UPLOADED",
            MimeType = request.MimeType,
            FileSize = stored.FileSize,
            StorageKey = stored.StorageKey,
            Sha256Hash = stored.Sha256Hash,
            UploadedBy = request.UploadedBy,
            UploadedAt = DateTime.UtcNow
        };

        await _attachments.AddAsync(attachment, cancellationToken);
        await _attachments.SaveChangesAsync(cancellationToken);

        return new UploadAttachmentResult(attachment.Id);
    }
}
