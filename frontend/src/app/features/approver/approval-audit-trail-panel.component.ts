import { Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApproverService, ApprovalAuditTrail } from './approver.service';

@Component({
  selector: 'app-approval-audit-trail-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="aat-panel">

  <div class="aat-hd">
    <div>
      <div class="aat-title">Approval Audit Trail</div>
      <div class="aat-sub">FS-29 — immutable approval chain</div>
    </div>
    <button class="aat-refresh" (click)="reload()" [disabled]="loading()">↺ Refresh</button>
  </div>

  @if (loading()) {
    <div class="aat-empty">Loading audit trail…</div>
  } @else if (error()) {
    <div class="aat-empty aat-empty--error">{{ error() }}</div>
  } @else if (trail()) {

    <div class="aat-meta">
      <span class="aat-meta-item"><strong>{{ trail()!.incidentReference }}</strong></span>
      <span class="aat-meta-item">Escalation L{{ trail()!.currentEscalationLevel }}</span>
      <span class="aat-meta-item">Routes: {{ trail()!.routeCount }}</span>
      @if (trail()!.loopGuardTriggered) {
        <span class="aat-flag">Loop guard triggered</span>
      }
    </div>

    <!-- Approval Chain -->
    <div class="aat-section">
      <div class="aat-section-title">Approval Chain</div>
      @if (trail()!.approvalChain.length === 0) {
        <div class="aat-empty aat-empty--inline">No approval votes recorded</div>
      } @else {
        <table class="aat-table">
          <thead>
            <tr>
              <th>When</th><th>Gate</th><th>Level</th><th>Actor</th>
              <th>Role</th><th>Decision</th><th>Reason</th>
            </tr>
          </thead>
          <tbody>
            @for (row of trail()!.approvalChain; track row.submittedAt + row.gate) {
              <tr>
                <td class="cell-nowrap">{{ formatDate(row.submittedAt) }}</td>
                <td>{{ row.gate }}</td>
                <td>{{ row.approvalLevelAtAction }}</td>
                <td>{{ row.actorName }}</td>
                <td>{{ row.actorRole }}</td>
                <td [class]="row.isApprove ? 'decision--approve' : 'decision--reject'">
                  {{ row.isApprove ? 'Approved' : 'Rejected' }}
                </td>
                <td>{{ row.rejectionReason ?? '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <!-- Claim History -->
    <div class="aat-section">
      <div class="aat-section-title">Claim History</div>
      @if (trail()!.claimHistory.length === 0) {
        <div class="aat-empty aat-empty--inline">No claim events</div>
      } @else {
        <table class="aat-table">
          <thead>
            <tr>
              <th>Approver</th><th>Role</th><th>Claimed</th>
              <th>Expires</th><th>Duration</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (row of trail()!.claimHistory; track row.claimedAt + row.approverName) {
              <tr [class.row--active]="row.isActive">
                <td>{{ row.approverName }}</td>
                <td>{{ row.approverRole }}</td>
                <td class="cell-nowrap">{{ formatDate(row.claimedAt) }}</td>
                <td class="cell-nowrap">{{ formatDate(row.expiresAt) }}</td>
                <td>{{ row.durationMinutes }}m</td>
                <td>{{ row.isActive ? 'Active' : 'Released' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <!-- Routing Events -->
    <div class="aat-section">
      <div class="aat-section-title">Routing Events</div>
      @if (trail()!.routingEvents.length === 0) {
        <div class="aat-empty aat-empty--inline">No reroute events</div>
      } @else {
        <table class="aat-table">
          <thead>
            <tr>
              <th>When</th><th>Category</th><th>Severity</th>
              <th>Changed By</th><th>Reason</th><th>Loop Guard</th>
            </tr>
          </thead>
          <tbody>
            @for (row of trail()!.routingEvents; track row.changedAt) {
              <tr [class.row--warn]="row.triggeredLoopGuard">
                <td class="cell-nowrap">{{ formatDate(row.changedAt) }}</td>
                <td>{{ row.previousCategory }} → {{ row.newCategory }}</td>
                <td>{{ sevLabel(row.previousSeverity) }} → {{ sevLabel(row.newSeverity) }}</td>
                <td>{{ row.changedByName }}</td>
                <td>{{ row.reason ?? '—' }}</td>
                <td>{{ row.triggeredLoopGuard ? 'Yes' : '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  }
</div>
`,
  styles: [`
    .aat-panel { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:1rem 1.1rem; }
    .aat-hd { display:flex; align-items:flex-start; justify-content:space-between;
      margin-bottom:0.85rem; gap:0.75rem; }
    .aat-title { font-size:0.85rem; font-weight:700; color:#111827; }
    .aat-sub { font-size:0.72rem; color:#9ca3af; margin-top:2px; }
    .aat-refresh { padding:5px 12px; font-size:0.75rem; font-weight:500; background:#fff;
      border:1px solid #d1d5db; border-radius:7px; cursor:pointer; color:#374151; flex-shrink:0; }
    .aat-refresh:hover:not(:disabled) { background:#f9fafb; }
    .aat-refresh:disabled { opacity:0.5; cursor:not-allowed; }

    .aat-meta { display:flex; flex-wrap:wrap; gap:0.5rem 1rem; margin-bottom:1rem;
      font-size:0.78rem; color:#6b7280; }
    .aat-meta-item strong { color:#111827; }
    .aat-flag { background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:999px;
      font-size:0.72rem; font-weight:600; }

    .aat-section { margin-bottom:1.1rem; }
    .aat-section:last-child { margin-bottom:0; }
    .aat-section-title { font-size:0.72rem; font-weight:700; color:#374151;
      text-transform:uppercase; letter-spacing:.04em; margin-bottom:0.55rem; }

    .aat-empty { padding:1.5rem; text-align:center; color:#9ca3af; font-size:0.82rem; }
    .aat-empty--inline { padding:0.75rem 0; }
    .aat-empty--error { color:#dc2626; }

    .aat-table { width:100%; border-collapse:collapse; font-size:0.78rem; }
    .aat-table th { text-align:left; padding:0.4rem 0.5rem; color:#6b7280; font-weight:600;
      border-bottom:1px solid #e5e7eb; font-size:0.68rem; text-transform:uppercase; white-space:nowrap; }
    .aat-table td { padding:0.45rem 0.5rem; border-bottom:1px solid #f3f4f6; color:#374151; vertical-align:top; }
    .cell-nowrap { white-space:nowrap; font-size:0.72rem; color:#6b7280; }
    .decision--approve { color:#16a34a; font-weight:600; }
    .decision--reject { color:#dc2626; font-weight:600; }
    .row--active td { background:#eff6ff; }
    .row--warn td { background:#fffbeb; }
  `]
})
export class ApprovalAuditTrailPanelComponent {
  incidentId = input.required<string>();

  private svc = inject(ApproverService);

  trail = signal<ApprovalAuditTrail | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.incidentId();
      if (id) this.load(id);
    });
  }

  reload(): void {
    const id = this.incidentId();
    if (id) this.load(id);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getApprovalAuditTrail(id).subscribe({
      next: t => {
        this.trail.set(t);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load approval audit trail.');
        this.trail.set(null);
        this.loading.set(false);
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  sevLabel(v: number): string {
    return ['', 'Critical', 'High', 'Medium', 'Low'][v] ?? String(v);
  }
}
