using FactoryShield.Domain.Enums;

namespace FactoryShield.Domain.Services;

/// <summary>
/// Resolves the SLA budget (in minutes) for a stage given the incident severity.
/// Severity: 1 = CRITICAL, 2 = HIGH, 3 = MEDIUM, 4 = LOW (architecture.md §3.2).
/// Values are the MVP defaults; a configurable policy table is a later concern.
/// </summary>
public static class SlaPolicy
{
    public static int TargetMinutes(string stage, int severity) => stage switch
    {
        SlaStage.Triage => severity switch
        {
            1 => 60,      // 1 hour
            2 => 240,     // 4 hours
            3 => 480,     // 8 hours
            _ => 1440     // 24 hours
        },
        SlaStage.Assignment => severity switch
        {
            1 => 120,     // 2 hours
            2 => 480,     // 8 hours
            3 => 960,     // 16 hours
            _ => 2880     // 48 hours
        },
        SlaStage.Resolution => severity switch
        {
            1 => 480,     // 8 hours
            2 => 1440,    // 24 hours
            3 => 2880,    // 48 hours
            _ => 5760     // 96 hours
        },
        _ => 1440
    };
}
