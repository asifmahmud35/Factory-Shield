using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;

namespace FactoryShield.Application.Common.Interfaces;

/// <summary>
/// The ONLY place that writes Incident.Status.
/// MVP: enforces the 7-state simplified machine per architecture.md §11.
/// FS-05/FS-06/FS-10 will extend this without touching call sites.
/// </summary>
public interface IIncidentStateMachine
{
    /// <summary>
    /// Applies <paramref name="targetState"/> to <paramref name="incident"/>,
    /// validating the transition is legal. Throws InvalidOperationException if not.
    /// Does NOT save — the caller's handler owns the SaveChangesAsync call.
    /// </summary>
    void Transition(Incident incident, IncidentStatus targetState);
}
