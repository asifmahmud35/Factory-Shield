using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Compliance.Models;
using FactoryShield.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class ComplianceDashboardRepository : IComplianceDashboardRepository
{
    private readonly AppDbContext _db;

    public ComplianceDashboardRepository(AppDbContext db) => _db = db;

    public async Task<ComplianceDashboardDto> GetDashboardAsync(
        DateTime from, DateTime to, Guid currentUserId, CancellationToken ct)
    {
        // ── Panel A: Incident Pipeline by Stage ───────────────────────────────
        var pipeline = await _db.Incidents
            .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
            .GroupBy(i => i.Status)
            .Select(g => new IncidentPipelineItem(g.Key.ToString(), g.Count()))
            .ToListAsync(ct);

        // ── Panel B: Investigation Methodology Distribution ───────────────────
        var methodologies = await _db.Investigations
            .Where(inv => inv.OpenedAt >= from && inv.OpenedAt <= to)
            .GroupBy(inv => inv.RootCauseCode ?? "UNKNOWN_UNDER_INVESTIGATION")
            .Select(g => new MethodologyItem(
                g.Key,
                g.Count(),
                g.Key == "OTHER" || g.Key == "UNKNOWN_UNDER_INVESTIGATION"))
            .ToListAsync(ct);

        // ── Panel C: Overdue / Repeat-Failure CAPAs ───────────────────────────
        var now = DateTime.UtcNow;
        var repeatCapa = await _db.CorrectiveActions
            .Where(ca => ca.CapaRejectionCount >= 2
                      && ca.Incident.CreatedAt >= from
                      && ca.Incident.CreatedAt <= to)
            .Select(ca => new RepeatFailureCapaItem(
                ca.Incident.IncidentReference,
                ca.Title,
                ca.CapaRejectionCount,
                ca.DueDate.HasValue ? (int)(now - ca.DueDate.Value).TotalDays : 0,
                true))
            .ToListAsync(ct);

        // ── Panel D: Identity Access Audit ────────────────────────────────────
        var auditLog = await _db.IdentityAccessAudits
            .Where(a => a.AccessedAt >= from && a.AccessedAt <= to && a.AccessedById != currentUserId)
            .OrderByDescending(a => a.AccessedAt)
            .Take(100)
            .Select(a => new IdentityAccessAuditItem(
                a.AccessedBy.Name,
                a.AccessedBy.Role.Code,
                a.Incident.IncidentReference,
                a.Reason ?? "No reason given",
                a.AccessedAt))
            .ToListAsync(ct);

        // ── Panel E: Rejection Dispute Summary ────────────────────────────────
        var disputes = await _db.Incidents
            .Where(i => i.Decision == ApprovalDecision.SoftReject
                     && i.CreatedAt >= from && i.CreatedAt <= to)
            .Select(i => new RejectionDisputeItem(
                i.IncidentReference,
                i.RejectReason ?? "No reason",
                i.Status == IncidentStatus.Submitted ? "Open" : "Resolved",
                i.CreatedAt,
                i.Status == IncidentStatus.Submitted))
            .ToListAsync(ct);

        // ── Panel F: Loop Guard & Tiebreak Pending ────────────────────────────
        var loopGuard = await _db.Incidents
            .Where(i => i.LoopGuardTriggered
                     && i.CreatedAt >= from && i.CreatedAt <= to)
            .Select(i => new LoopGuardItem(
                i.IncidentReference,
                i.RouteCount,
                (int)(now - i.CreatedAt).TotalDays,
                false))
            .ToListAsync(ct);

        // ── Panel G: Escalation Exhausted ────────────────────────────────────
        var exhausted = await _db.Escalations
            .Where(e => e.EscalationExhausted
                     && e.EscalationExhaustedAt >= from
                     && e.EscalationExhaustedAt <= to)
            .Select(e => new EscalationExhaustedItem(
                e.Incident.IncidentReference,
                e.FallbackNotifiedRole ?? "Admin",
                e.EscalationExhaustedAt!.Value,
                (now - e.EscalationExhaustedAt!.Value).TotalHours))
            .ToListAsync(ct);

        return new ComplianceDashboardDto(
            from, to,
            pipeline,
            methodologies,
            repeatCapa,
            auditLog,
            disputes,
            loopGuard,
            exhausted);
    }
}
