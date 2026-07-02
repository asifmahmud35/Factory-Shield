namespace FactoryShield.Domain.Enums;

/// <summary>
/// Canonical SLA stage names. Stored as strings on <c>SlaClock.Stage</c> so the set can grow
/// (INVESTIGATION, RCA_REVIEW, …) without an enum migration when the full pipeline lands.
/// </summary>
public static class SlaStage
{
    public const string Triage = "TRIAGE";
    public const string Assignment = "ASSIGNMENT";
    public const string Resolution = "RESOLUTION";
}
