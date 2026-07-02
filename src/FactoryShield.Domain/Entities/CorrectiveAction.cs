namespace FactoryShield.Domain.Entities;

public class CorrectiveAction
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Owner { get; set; }
    public DateTime? DueDate { get; set; }

    /// <summary>1=Critical, 2=High, 3=Medium, 4=Low</summary>
    public int Priority { get; set; } = 3;

    /// <summary>0–100</summary>
    public int CompletionPercentage { get; set; }

    /// <summary>Open | InProgress | Completed | Verified</summary>
    public string Status { get; set; } = "Open";

    public string? VerifiedBy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Incremented each time CAPA_VERIFICATION gate rejects this action (FS-27 Panel C).</summary>
    public int CapaRejectionCount { get; set; }
}
