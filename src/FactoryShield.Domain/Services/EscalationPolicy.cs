namespace FactoryShield.Domain.Services;

public static class EscalationPolicy
{
    /// <summary>Maximum escalation level before exhaustion (L1 → L2, then exhausted).</summary>
    public const int MaxLevel = 2;

    public const string FallbackRole = "ADMIN";
}
