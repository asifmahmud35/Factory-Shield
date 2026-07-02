namespace FactoryShield.Domain.Entities;

/// <summary>
/// Tracks the SLA countdown for a single incident stage (TRIAGE, ASSIGNMENT, RESOLUTION).
/// A clock is "running" while <see cref="StoppedAt"/> is null. Elapsed/remaining time and
/// breach status are computed from StartedAt + TargetMinutes (client- or server-side).
/// Automatic breach-notification firing is deferred to the Hangfire slice (FS-14b).
/// </summary>
public class SlaClock
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    /// <summary>TRIAGE, ASSIGNMENT, or RESOLUTION — see <c>SlaStage</c>.</summary>
    public string Stage { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; }

    /// <summary>Null while the clock is still running.</summary>
    public DateTime? StoppedAt { get; set; }

    /// <summary>SLA budget for this stage in minutes, resolved from severity via <c>SlaPolicy</c>.</summary>
    public int TargetMinutes { get; set; }

    // ── SLA pause (FS-19) ────────────────────────────────────────────────────
    /// <summary>Set when an Approver requests more info; cleared on Reporter response.</summary>
    public DateTime? PausedAt { get; set; }
    /// <summary>Total pause time accumulated across all pause/resume cycles, in minutes.</summary>
    public int AccumulatedPauseMinutes { get; set; }
}
