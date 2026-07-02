using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Incidents.Queries;

public record GetOfflineSyncStatusQuery(Guid ReporterId) : IRequest<OfflineSyncStatusDto>;

public record OfflineSyncStatusDto(
    int TotalDrafts,
    int Queued,
    int Synced,
    int Failed
);

public class GetOfflineSyncStatusQueryHandler
    : IRequestHandler<GetOfflineSyncStatusQuery, OfflineSyncStatusDto>
{
    private readonly IOfflineDraftRepository _drafts;

    public GetOfflineSyncStatusQueryHandler(IOfflineDraftRepository drafts) => _drafts = drafts;

    public async Task<OfflineSyncStatusDto> Handle(
        GetOfflineSyncStatusQuery request, CancellationToken ct)
    {
        var mine = await _drafts.GetByReporterIdAsync(request.ReporterId, ct);
        return new OfflineSyncStatusDto(
            mine.Count,
            mine.Count(d => d.SyncStatus == "Queued"),
            mine.Count(d => d.SyncStatus == "Synced"),
            mine.Count(d => d.SyncStatus == "SyncFailed")
        );
    }
}
