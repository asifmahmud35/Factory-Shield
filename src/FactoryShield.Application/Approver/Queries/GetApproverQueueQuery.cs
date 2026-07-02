using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Approver.Queries;

public record GetApproverQueueQuery() : IRequest<IReadOnlyList<IncidentSummaryDto>>;
