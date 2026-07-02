namespace FactoryShield.Application.Common.Interfaces;

/// <summary>
/// Writes to the escalation notification history table (FS-15d) whenever
/// an escalation alert is dispatched via any channel.
/// </summary>
public interface IEscalationNotificationRecorder
{
    Task RecordAsync(
        Guid? incidentId,
        string incidentReference,
        Guid? ruleId,
        string ruleName,
        string via,
        string recipients,
        string status = "Delivered",
        CancellationToken ct = default);
}
