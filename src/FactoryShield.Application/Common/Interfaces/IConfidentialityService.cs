using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IConfidentialityService
{
    string? GetReporterDisplay(Incident incident, string callerRole);
    bool IsConfidential(Incident incident);
}
