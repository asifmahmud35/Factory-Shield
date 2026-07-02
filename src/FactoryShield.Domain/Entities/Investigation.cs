using FactoryShield.Domain.Enums;

namespace FactoryShield.Domain.Entities;

public class Investigation
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public string? Owner { get; set; }
    public DateTime? InvestigationDate { get; set; }
    public DateTime? TargetCompletionDate { get; set; }
    public RiskLevel? RiskLevel { get; set; }

    /// <summary>5WHY | FISHBONE | FAULT_TREE | 8D — RCA methodology used (FS-27 Panel B).</summary>
    public string? RootCauseCode { get; set; }
    public string? RootCauseDescription { get; set; }

    /// <summary>NOT_STARTED | IN_PROGRESS | ROOT_CAUSE_IDENTIFIED | BLOCKED (Epic 2 Final US-2).</summary>
    public string InvestigationStatus { get; set; } = "IN_PROGRESS";
    public DateTime? InvestigationCompletedAt { get; set; }

    public string? Notes { get; set; }
    public string? FindingsSummary { get; set; }
    public string? ImmediateActionTaken { get; set; }
    public string? LessonsLearned { get; set; }

    // ── RCA workspace (5-Why + fishbone) ─────────────────────────────────────
    public string? RcaMethod { get; set; }
    public string? ProblemStatement { get; set; }
    /// <summary>JSON array of { order, text }.</summary>
    public string? WhyEntriesJson { get; set; }
    /// <summary>JSON object with man/machine/method/material/environment/management keys.</summary>
    public string? FishboneJson { get; set; }
    public string? StructuredCategory { get; set; }
    /// <summary>JSON array of RCA checklist item ids (physical, human, …).</summary>
    public string? RcaChecklistJson { get; set; }
    /// <summary>Draft | Submitted</summary>
    public string RcaStatus { get; set; } = "Draft";
    public DateTime? RcaSubmittedAt { get; set; }

    public DateTime OpenedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ICollection<InvestigationChecklistItem> ChecklistItems { get; set; } = [];
    public ICollection<InvestigationTimelineEvent> TimelineEvents { get; set; } = [];
}
