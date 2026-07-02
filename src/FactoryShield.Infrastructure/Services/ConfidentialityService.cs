using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;

namespace FactoryShield.Infrastructure.Services;

public class ConfidentialityService : IConfidentialityService
{
    public bool IsConfidential(Incident incident) =>
        incident.ReportingMode is "confidential" or "anonymous_guest";

    public string? GetReporterDisplay(Incident incident, string callerRole)
    {
        if (incident.ReporterVisibility == "anonymous") return null;
        if (incident.ReporterVisibility == "masked")
        {
            // Only Governance sees real identity
            if (callerRole is "ADMIN")
                return incident.Reporter?.Email;
            return null;
        }
        return incident.Reporter?.Email;
    }
}
