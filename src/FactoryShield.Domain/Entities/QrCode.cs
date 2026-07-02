namespace FactoryShield.Domain.Entities;

public class QrCode
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string QrType { get; set; } = string.Empty; // machine | line | area | safety_poster | anonymous_public
    public string? FactoryId { get; set; }
    public string? SectionId { get; set; }
    public string? LineId { get; set; }
    public string? MachineId { get; set; }
    public string Label { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? DeactivatedAt { get; set; }
    public Guid? DeactivatedById { get; set; }
    public int ScanCount { get; set; }
    public DateTime? LastScannedAt { get; set; }
}
