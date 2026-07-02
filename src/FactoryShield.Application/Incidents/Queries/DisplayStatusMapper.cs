using FactoryShield.Domain.Enums;

namespace FactoryShield.Application.Incidents.Queries;

internal static class DisplayStatusMapper
{
    internal static string Map(IncidentStatus status) => status switch
    {
        IncidentStatus.Submitted or IncidentStatus.Triaged    => "Submitted",
        IncidentStatus.Assigned  or IncidentStatus.InProgress => "In Progress",
        IncidentStatus.Resolved  or IncidentStatus.Closed     => "Resolved",
        IncidentStatus.Rejected                               => "Rejected",
        IncidentStatus.MergedClosed                           => "Merged",
        IncidentStatus.PendingReporterInput                   => "Pending Reporter Input",
        _                                                     => status.ToString()
    };
}
