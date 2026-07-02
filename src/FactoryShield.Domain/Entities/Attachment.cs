namespace FactoryShield.Domain.Entities;

public class Attachment
{
    public Guid Id { get; set; }
    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public Guid? CorrectiveActionId { get; set; }
    public CorrectiveAction? CorrectiveAction { get; set; }

    public string AttachmentType { get; set; } = string.Empty;
    public string UploadStatus { get; set; } = "UPLOADED";
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string Sha256Hash { get; set; } = string.Empty;

    public Guid? UploadedBy { get; set; }
    public User? Uploader { get; set; }

    public DateTime UploadedAt { get; set; }
    public string? EvidenceNote { get; set; }
}
