using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Incidents.Queries;

/// <summary>Org-wide incident list for non-Reporter roles (Admin/Approver/Resolver/Governance).</summary>
public record GetAllIncidentsQuery(string ViewerRole) : IRequest<IReadOnlyList<IncidentSummaryDto>>;
