import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ComplianceService,
  ComplianceDashboard,
  IdentityAccessAuditItem,
} from './compliance.service';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="cd-page">

  <div class="cd-hd">
    <div>
      <h1 class="cd-title">Compliance Dashboard</h1>
      <p class="cd-sub">7-panel audit view — FS-27</p>
    </div>
    <div class="cd-actions">
      <label class="date-field">
        <span>From</span>
        <input type="date" [(ngModel)]="fromDate" (change)="load()">
      </label>
      <label class="date-field">
        <span>To</span>
        <input type="date" [(ngModel)]="toDate" (change)="load()">
      </label>
      <button class="action-btn" (click)="load()" [disabled]="loading()">↺ Refresh</button>
    </div>
  </div>

  <!-- Export evidence package -->
  <div class="export-bar">
    <div class="export-bar__label">Watermarked evidence export</div>
    <input class="export-input" type="text" placeholder="Incident ID (UUID)"
      [(ngModel)]="exportIncidentId">
    <button class="action-btn action-btn--primary" (click)="exportPackage()"
      [disabled]="exporting() || !exportIncidentId.trim()">
      Export PDF
    </button>
    @if (exportError()) {
      <span class="export-error">{{ exportError() }}</span>
    }
  </div>

  @if (loading()) {
    <div class="cd-empty">Loading compliance dashboard…</div>
  } @else if (error()) {
    <div class="cd-empty cd-empty--error">{{ error() }}</div>
  } @else if (data()) {

    <div class="panel-grid">

      <!-- Panel A: Incident Pipeline -->
      <div class="panel">
        <div class="panel-title">A — Incident Pipeline</div>
        @for (row of data()!.panelA_IncidentPipeline; track row.stage) {
          <div class="bar-row">
            <span class="bar-label bar-label--wide">{{ row.stage }}</span>
            <div class="bar-track">
              <div class="bar-fill bar-fill--blue"
                [style.width]="barWidth(row.count, maxPipeline()) + '%'"></div>
            </div>
            <span class="bar-count">{{ row.count }}</span>
          </div>
        }
        @if (data()!.panelA_IncidentPipeline.length === 0) {
          <div class="panel-empty">No pipeline data</div>
        }
      </div>

      <!-- Panel B: Investigation Methodology -->
      <div class="panel">
        <div class="panel-title">B — Investigation Methodology</div>
        @for (row of data()!.panelB_InvestigationMethodology; track row.methodology) {
          <div class="bar-row" [class.bar-row--warn]="row.requiresWeeklyReview">
            <span class="bar-label bar-label--wide">{{ row.methodology }}</span>
            <div class="bar-track">
              <div class="bar-fill bar-fill--teal"
                [style.width]="barWidth(row.count, maxMethodology()) + '%'"></div>
            </div>
            <span class="bar-count">{{ row.count }}</span>
            @if (row.requiresWeeklyReview) {
              <span class="warn-badge" title="Requires weekly review">⚠</span>
            }
          </div>
        }
        @if (data()!.panelB_InvestigationMethodology.length === 0) {
          <div class="panel-empty">No methodology data</div>
        }
      </div>

      <!-- Panel C: Repeat-Failure CAPA -->
      <div class="panel">
        <div class="panel-title">C — Overdue / Repeat-Failure CAPA</div>
        @if (data()!.panelC_RepeatFailureCapa.length === 0) {
          <div class="panel-empty">No repeat-failure CAPAs</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>Incident</th><th>CAPA</th><th>Rejects</th><th>Overdue</th></tr>
            </thead>
            <tbody>
              @for (row of data()!.panelC_RepeatFailureCapa; track row.incidentReference + row.capaTitle) {
                <tr [class.row--danger]="row.blocksClosure">
                  <td>{{ row.incidentReference }}</td>
                  <td>{{ row.capaTitle }}</td>
                  <td>{{ row.rejectionCount }}</td>
                  <td>{{ row.daysOverdue }}d</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Panel D: Identity Access Audit -->
      <div class="panel panel--wide">
        <div class="panel-hd">
          <div class="panel-title">D — Identity Access Audit</div>
          <button class="action-btn action-btn--sm" (click)="loadIdentityAudit()"
            [disabled]="auditLoading()">↺ Refresh audit</button>
        </div>
        @if (identityAudit().length === 0) {
          <div class="panel-empty">No identity access events (SoD-filtered)</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>When</th><th>Accessor</th><th>Role</th><th>Incident</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              @for (row of identityAudit(); track row.accessedAt + row.incidentReference) {
                <tr>
                  <td class="cell-nowrap">{{ formatDate(row.accessedAt) }}</td>
                  <td>{{ row.accessorName }}</td>
                  <td>{{ row.accessorRole }}</td>
                  <td>{{ row.incidentReference }}</td>
                  <td>{{ row.purpose }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Panel E: Rejection Dispute Summary -->
      <div class="panel">
        <div class="panel-title">E — Rejection Dispute Summary</div>
        @if (data()!.panelE_RejectionDispute.length === 0) {
          <div class="panel-empty">No soft-rejection disputes</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>Incident</th><th>Status</th><th>Reopened</th></tr>
            </thead>
            <tbody>
              @for (row of data()!.panelE_RejectionDispute; track row.incidentReference) {
                <tr>
                  <td>{{ row.incidentReference }}</td>
                  <td>{{ row.disputeStatus }}</td>
                  <td>{{ row.reopenedFromRejection ? 'Yes' : 'No' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Panel F: Loop Guard & Tiebreak -->
      <div class="panel">
        <div class="panel-title">F — Loop Guard &amp; Tiebreak</div>
        @if (data()!.panelF_LoopGuard.length === 0) {
          <div class="panel-empty">No loop-guard cases</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>Incident</th><th>Reroutes</th><th>Stalled</th><th>Tiebreak</th></tr>
            </thead>
            <tbody>
              @for (row of data()!.panelF_LoopGuard; track row.incidentReference) {
                <tr [class.row--warn]="row.tiebreakPending">
                  <td>{{ row.incidentReference }}</td>
                  <td>{{ row.rerouteCount }}</td>
                  <td>{{ row.daysStalled }}d</td>
                  <td>{{ row.tiebreakPending ? 'Pending' : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Panel G: Escalation Exhausted -->
      <div class="panel">
        <div class="panel-title">G — Escalation Exhausted</div>
        @if (data()!.panelG_EscalationExhausted.length === 0) {
          <div class="panel-empty">No exhausted escalations</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>Incident</th><th>Fallback</th><th>Hours</th></tr>
            </thead>
            <tbody>
              @for (row of data()!.panelG_EscalationExhausted; track row.incidentReference) {
                <tr>
                  <td>{{ row.incidentReference }}</td>
                  <td>{{ row.fallbackNotifiedRole }}</td>
                  <td>{{ row.hoursElapsed | number:'1.0-0' }}h</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

    </div>
  }
</div>
`,
  styles: [`
    .cd-page { padding:1.25rem 1.75rem; max-width:1200px; margin:0 auto; font-family:inherit; }
    .cd-hd { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem;
      margin-bottom:1rem; flex-wrap:wrap; }
    .cd-title { font-size:1.4rem; font-weight:700; color:#111827; margin:0 0 3px; }
    .cd-sub { font-size:0.8rem; color:#9ca3af; margin:0; }
    .cd-actions { display:flex; gap:0.5rem; flex-wrap:wrap; align-items:flex-end; }
    .date-field { display:flex; flex-direction:column; gap:2px; font-size:0.72rem; color:#6b7280; }
    .date-field input { padding:5px 8px; font-size:0.78rem; border:1px solid #d1d5db;
      border-radius:7px; background:#fff; }
    .action-btn { padding:6px 14px; font-size:0.78rem; font-weight:500; background:#fff;
      border:1px solid #d1d5db; border-radius:7px; cursor:pointer; color:#374151; }
    .action-btn:hover:not(:disabled) { background:#f9fafb; }
    .action-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .action-btn--primary { background:#2563eb; color:#fff; border-color:#2563eb; }
    .action-btn--primary:hover:not(:disabled) { background:#1d4ed8; }
    .action-btn--sm { padding:4px 10px; font-size:0.72rem; }

    .export-bar { display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;
      background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:0.85rem 1.1rem;
      margin-bottom:1.25rem; }
    .export-bar__label { font-size:0.78rem; font-weight:600; color:#374151; flex-shrink:0; }
    .export-input { flex:1; min-width:200px; padding:6px 10px; font-size:0.78rem;
      border:1px solid #d1d5db; border-radius:7px; }
    .export-error { font-size:0.75rem; color:#dc2626; }

    .cd-empty { padding:3rem; text-align:center; color:#9ca3af; font-size:0.85rem;
      background:#fff; border:1px solid #e5e7eb; border-radius:10px; }
    .cd-empty--error { color:#dc2626; }

    .panel-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; }
    @media (max-width:1000px) { .panel-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:640px)  { .panel-grid { grid-template-columns:1fr; } }
    .panel { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:1rem 1.1rem; }
    .panel--wide { grid-column:1 / -1; }
    .panel-hd { display:flex; align-items:center; justify-content:space-between;
      margin-bottom:0.75rem; gap:0.5rem; }
    .panel-hd .panel-title { margin-bottom:0; }
    .panel-title { font-size:0.78rem; font-weight:700; color:#374151; margin-bottom:0.75rem;
      text-transform:uppercase; letter-spacing:.04em; }
    .panel-empty { font-size:0.78rem; color:#9ca3af; text-align:center; padding:1rem 0; }

    .bar-row { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.55rem; font-size:0.78rem; }
    .bar-row--warn { background:#fffbeb; margin:0 -0.5rem; padding:0.25rem 0.5rem; border-radius:6px; }
    .bar-label { color:#374151; width:70px; flex-shrink:0; font-weight:500; overflow:hidden;
      text-overflow:ellipsis; white-space:nowrap; }
    .bar-label--wide { width:110px; }
    .bar-track { flex:1; height:8px; background:#f3f4f6; border-radius:4px; overflow:hidden; }
    .bar-fill { height:100%; border-radius:4px; }
    .bar-fill--blue { background:#3b82f6; }
    .bar-fill--teal { background:#14b8a6; }
    .bar-count { color:#6b7280; width:24px; text-align:right; flex-shrink:0; font-weight:600; }
    .warn-badge { color:#d97706; font-size:0.85rem; flex-shrink:0; }

    .data-table { width:100%; border-collapse:collapse; font-size:0.78rem; }
    .data-table th { text-align:left; padding:0.4rem 0.5rem; color:#6b7280; font-weight:600;
      border-bottom:1px solid #e5e7eb; font-size:0.7rem; text-transform:uppercase; }
    .data-table td { padding:0.45rem 0.5rem; border-bottom:1px solid #f3f4f6; color:#374151; }
    .cell-nowrap { white-space:nowrap; font-size:0.72rem; color:#6b7280; }
    .row--danger td { color:#dc2626; }
    .row--warn td { background:#fffbeb; }
  `]
})
export class ComplianceDashboardComponent implements OnInit {
  data = signal<ComplianceDashboard | null>(null);
  identityAudit = signal<IdentityAccessAuditItem[]>([]);
  loading = signal(true);
  auditLoading = signal(false);
  exporting = signal(false);
  error = signal<string | null>(null);
  exportError = signal<string | null>(null);

  fromDate = '';
  toDate = '';
  exportIncidentId = '';

  maxPipeline = computed(() => {
    const rows = this.data()?.panelA_IncidentPipeline ?? [];
    return Math.max(1, ...rows.map(r => r.count));
  });

  maxMethodology = computed(() => {
    const rows = this.data()?.panelB_InvestigationMethodology ?? [];
    return Math.max(1, ...rows.map(r => r.count));
  });

  constructor(private svc: ComplianceService) {}

  ngOnInit() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    this.toDate = toISODate(to);
    this.fromDate = toISODate(from);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    const from = this.fromDate ? new Date(this.fromDate).toISOString() : undefined;
    const to = this.toDate ? endOfDayISO(this.toDate) : undefined;

    this.svc.getDashboard(from, to).subscribe({
      next: d => {
        this.data.set(d);
        this.identityAudit.set(d.panelD_IdentityAccessAudit);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard. ADMIN role required.');
        this.loading.set(false);
      },
    });
  }

  loadIdentityAudit() {
    this.auditLoading.set(true);
    const from = this.fromDate ? new Date(this.fromDate).toISOString() : undefined;
    const to = this.toDate ? endOfDayISO(this.toDate) : undefined;

    this.svc.getIdentityAudit(from, to).subscribe({
      next: rows => {
        this.identityAudit.set(rows);
        this.auditLoading.set(false);
      },
      error: () => this.auditLoading.set(false),
    });
  }

  exportPackage() {
    const id = this.exportIncidentId.trim();
    if (!id) return;

    this.exporting.set(true);
    this.exportError.set(null);

    this.svc.exportAuditPackage(id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-package-${id.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
        this.loadIdentityAudit();
      },
      error: () => {
        this.exportError.set('Export failed — check incident ID and permissions.');
        this.exporting.set(false);
      },
    });
  }

  barWidth(count: number, max: number): number {
    return max === 0 ? 0 : Math.max(4, Math.round(count / max * 100));
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function endOfDayISO(dateStr: string): string {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
