using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents;
using FactoryShield.Application.Incidents.Models;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using FactoryShield.Domain.Services;
using FluentValidation;
using MediatR;

namespace FactoryShield.Application.Incidents.Commands;

public class CreateIncidentCommandHandler : IRequestHandler<CreateIncidentCommand, CreateIncidentResult>
{
    private readonly IIncidentRepository _incidents;
    private readonly ISlaClockRepository _slaClocks;
    private readonly IIncidentStateMachine _stateMachine;
    private readonly IValidator<CreateIncidentCommand> _validator;
    private readonly INotificationDispatcher _dispatcher;

    public CreateIncidentCommandHandler(
        IIncidentRepository incidents,
        ISlaClockRepository slaClocks,
        IIncidentStateMachine stateMachine,
        IValidator<CreateIncidentCommand> validator,
        INotificationDispatcher dispatcher)
    {
        _incidents = incidents;
        _slaClocks = slaClocks;
        _stateMachine = stateMachine;
        _validator = validator;
        _dispatcher = dispatcher;
    }

    public async Task<CreateIncidentResult> Handle(CreateIncidentCommand request, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            throw new ValidationException(validation.Errors);

        var now = DateTime.UtcNow;
        var year = now.Year;
        var count = await _incidents.CountByYearAsync(year, cancellationToken);
        var reference = $"INC-{year}-{count + 1:D4}";

        // Initial status is Submitted (enum default = 0). The state machine governs all
        // subsequent transitions — never set Status directly after this point.
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            IncidentReference = reference,
            Status = IncidentStatus.Submitted,
            ReporterId = request.ReporterId,
            Category = request.Category,
            Severity = request.Severity ?? 4,
            ShortDescription = request.ShortDescription,
            Department = string.IsNullOrWhiteSpace(request.Department) ? null : request.Department,
            CreatedAt = now,
            // FS-24: confidentiality
            ReportingMode = request.IsConfidential ? "confidential" : "normal",
            ReporterVisibility = request.IsConfidential ? "masked" : "visible",
            // FS-26: QR entry
            SourceChannel = request.SourceChannel,
            QrCodeId = request.QrCodeId,
            ManualOverrideReason = request.ManualOverrideReason,
        };

        IncidentReportFieldMapper.Apply(incident, request.ReportFields);

        await _incidents.AddAsync(incident, cancellationToken);

        // Start the TRIAGE SLA clock — the countdown until an Approver must action this incident.
        // Shares the same DbContext as the incident repo, so a single SaveChanges persists both.
        var triageClock = new SlaClock
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            Stage = SlaStage.Triage,
            StartedAt = now,
            TargetMinutes = SlaPolicy.TargetMinutes(SlaStage.Triage, incident.Severity)
        };
        await _slaClocks.AddAsync(triageClock, cancellationToken);

        await _incidents.SaveChangesAsync(cancellationToken);

        // US-10: Critical/High (1-2) incidents notify Approvers immediately and individually.
        // Medium/Low (3-4) are intentionally NOT dispatched here — LowPriorityDigestJob batches
        // them into a single periodic digest instead, so the queue isn't spammed one-at-a-time.
        if (incident.Severity <= 2)
        {
            await _dispatcher.DispatchAsync(new NotificationRequest(
                RecipientUserId: null,
                RecipientRole: "APPROVER",
                TriggerEvent: "NEW_INCIDENT",
                Title: $"New {(incident.Severity == 1 ? "Critical" : "High")} incident: {incident.IncidentReference}",
                Message: $"{incident.Category} — {incident.ShortDescription}",
                DeepLinkPath: $"/approver/queue",
                IncidentId: incident.Id,
                IdempotencyKey: $"new-incident:{incident.Id}",
                Channels: ["InApp", "Email"]
            ), cancellationToken);
        }

        return new CreateIncidentResult(incident.Id, incident.IncidentReference);
    }
}
