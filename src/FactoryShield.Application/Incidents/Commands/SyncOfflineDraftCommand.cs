using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents;
using FactoryShield.Application.Incidents.Models;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using FactoryShield.Domain.Services;
using MediatR;

namespace FactoryShield.Application.Incidents.Commands;

public record SyncOfflineDraftPayload(
    string LocalDraftId,
    string PayloadHash,
    string Category,
    string ShortDescription,
    int? Severity,
    string? Department,
    DateTime LocalEventTime,
    bool IsConfidential = false,
    IncidentReportFields? ReportFields = null
);

public record SyncOfflineDraftResult(
    string LocalDraftId,
    bool IsNew,
    Guid? ServerIncidentId,
    string? IncidentReference,
    string? Error
);

public record SyncOfflineDraftsBatchCommand(
    Guid ReporterId,
    List<SyncOfflineDraftPayload> Drafts
) : IRequest<List<SyncOfflineDraftResult>>;

public class SyncOfflineDraftsBatchCommandHandler
    : IRequestHandler<SyncOfflineDraftsBatchCommand, List<SyncOfflineDraftResult>>
{
    private readonly IOfflineDraftRepository _drafts;
    private readonly IIncidentRepository _incidents;
    private readonly ISlaClockRepository _slaClocks;
    private readonly IIncidentStateMachine _stateMachine;
    private readonly IIncidentStateLogger _logger;

    public SyncOfflineDraftsBatchCommandHandler(
        IOfflineDraftRepository drafts,
        IIncidentRepository incidents,
        ISlaClockRepository slaClocks,
        IIncidentStateMachine stateMachine,
        IIncidentStateLogger logger)
    {
        _drafts = drafts;
        _incidents = incidents;
        _slaClocks = slaClocks;
        _stateMachine = stateMachine;
        _logger = logger;
    }

    public async Task<List<SyncOfflineDraftResult>> Handle(
        SyncOfflineDraftsBatchCommand request, CancellationToken ct)
    {
        var results = new List<SyncOfflineDraftResult>();

        foreach (var payload in request.Drafts)
        {
            try
            {
                var result = await SyncOne(request.ReporterId, payload, ct);
                results.Add(result);
            }
            catch (Exception ex)
            {
                await PersistSyncFailureAsync(request.ReporterId, payload, ex.Message, ct);
                results.Add(new SyncOfflineDraftResult(
                    payload.LocalDraftId, false, null, null, ex.Message));
            }
        }

        return results;
    }

    private async Task PersistSyncFailureAsync(
        Guid reporterId, SyncOfflineDraftPayload payload, string error, CancellationToken ct)
    {
        var draft = await _drafts.FindByHashAsync(reporterId, payload.PayloadHash, ct)
                 ?? await _drafts.FindByLocalDraftIdAsync(reporterId, payload.LocalDraftId, ct);

        if (draft is null)
        {
            draft = new OfflineDraft
            {
                Id = Guid.NewGuid(),
                LocalDraftId = payload.LocalDraftId,
                ReporterId = reporterId,
                PayloadHash = payload.PayloadHash,
                PayloadJson = System.Text.Json.JsonSerializer.Serialize(payload),
                LocalEventTime = payload.LocalEventTime,
            };
            await _drafts.AddAsync(draft, ct);
        }

        draft.SyncStatus = "SyncFailed";
        draft.SyncErrorMessage = error;
        draft.SyncAttemptCount++;
        await _drafts.SaveChangesAsync(ct);
    }

    private async Task<SyncOfflineDraftResult> SyncOne(
        Guid reporterId, SyncOfflineDraftPayload payload, CancellationToken ct)
    {
        var existing = await _drafts.FindByHashAsync(reporterId, payload.PayloadHash, ct);
        if (existing is not null && existing.ServerIncidentId.HasValue)
        {
            var existingInc = await _incidents.FindByIdAsync(existing.ServerIncidentId.Value, ct);
            return new SyncOfflineDraftResult(
                payload.LocalDraftId, false,
                existing.ServerIncidentId, existingInc?.IncidentReference, null);
        }

        var now = DateTime.UtcNow;
        var year = now.Year;
        var count = await _incidents.CountByYearAsync(year, ct);
        var reference = $"INC-{year}-{count + 1:D4}";

        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            IncidentReference = reference,
            Status = IncidentStatus.Submitted,
            ReporterId = reporterId,
            Category = payload.Category,
            Severity = payload.Severity ?? 4,
            ShortDescription = payload.ShortDescription,
            Department = string.IsNullOrWhiteSpace(payload.Department) ? null : payload.Department,
            CreatedAt = payload.LocalEventTime,
            SourceChannel = "offline",
            ReportingMode = payload.IsConfidential ? "confidential" : "normal",
            ReporterVisibility = payload.IsConfidential ? "masked" : "visible",
        };

        IncidentReportFieldMapper.Apply(incident, payload.ReportFields);

        await _incidents.AddAsync(incident, ct);

        await _slaClocks.AddAsync(new SlaClock
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            Stage = SlaStage.Triage,
            StartedAt = now,
            TargetMinutes = SlaPolicy.TargetMinutes(SlaStage.Triage, incident.Severity)
        }, ct);

        var draft = existing ?? new OfflineDraft
        {
            Id = Guid.NewGuid(),
            LocalDraftId = payload.LocalDraftId,
            ReporterId = reporterId,
            PayloadHash = payload.PayloadHash,
            PayloadJson = System.Text.Json.JsonSerializer.Serialize(payload),
            LocalEventTime = payload.LocalEventTime,
        };

        draft.ServerIncidentId = incident.Id;
        draft.SyncStatus = "Synced";
        draft.ServerReceivedAt = now;
        draft.SyncAttemptCount++;
        draft.SyncErrorMessage = null;

        if (existing is null)
            await _drafts.AddAsync(draft, ct);

        await _incidents.SaveChangesAsync(ct);
        await _drafts.SaveChangesAsync(ct);

        await _logger.LogAsync(
            incidentId: incident.Id,
            eventType: "STATE_CHANGE",
            fromStatus: null,
            toStatus: IncidentStatus.Submitted.ToString(),
            actorId: reporterId,
            actorRole: "REPORTER",
            description: $"Synced from offline draft (localDraftId={payload.LocalDraftId})",
            visibilityScope: "PUBLIC",
            ct: ct);

        return new SyncOfflineDraftResult(
            payload.LocalDraftId, true, incident.Id, incident.IncidentReference, null);
    }
}
