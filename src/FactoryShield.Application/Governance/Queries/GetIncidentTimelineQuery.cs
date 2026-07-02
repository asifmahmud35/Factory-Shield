using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Governance.Models;
using MediatR;

namespace FactoryShield.Application.Governance.Queries;

public record GetIncidentTimelineQuery(Guid IncidentId, string CallerRole) : IRequest<List<IncidentTimelineEntryDto>>;

public class GetIncidentTimelineQueryHandler : IRequestHandler<GetIncidentTimelineQuery, List<IncidentTimelineEntryDto>>
{
    private readonly IIncidentStateLogRepository _logs;

    public GetIncidentTimelineQueryHandler(IIncidentStateLogRepository logs) => _logs = logs;

    public async Task<List<IncidentTimelineEntryDto>> Handle(
        GetIncidentTimelineQuery request, CancellationToken ct)
    {
        var allowedScopes = request.CallerRole switch
        {
            "ADMIN" => new[] { "PUBLIC", "INTERNAL", "RESTRICTED" },
            "REPORTER"           => new[] { "PUBLIC" },
            _                    => new[] { "PUBLIC", "INTERNAL" },
        };

        var logs = await _logs.GetByIncidentIdFilteredAsync(request.IncidentId, allowedScopes, ct);

        return logs.Select(l => new IncidentTimelineEntryDto(
            l.Id,
            l.EventType,
            l.FromStatus,
            l.ToStatus,
            l.Actor?.Email,
            l.ActorRole,
            l.Description,
            l.PreviousValue,
            l.NewValue,
            l.VisibilityScope,
            l.CreatedAt
        )).ToList();
    }
}
