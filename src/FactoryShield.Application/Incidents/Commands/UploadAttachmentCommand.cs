using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Incidents.Commands;

public record UploadAttachmentCommand(
    Guid IncidentId,
    Stream FileContent,
    string FileName,
    string MimeType,
    long FileSizeBytes,
    Guid UploadedBy
) : IRequest<UploadAttachmentResult>;
