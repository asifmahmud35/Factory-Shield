import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GovernanceService, ExecutiveDashboard } from './governance.service';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="ed-page">

  <div class="ed-hd">
    <div>
      <h1 class="ed-title">Executive Dashboard</h1>
      <p class="ed-sub">KPI scorecard — rolling 30 days</p>
    </div>
    <button class="refresh-btn" (click)="load()">↺ Refresh</button>
  </div>

  @if (loading()) {
    <div class="ed-empty">Loading dashboard…</div>
  } @else if (!data()) {
    <div class="ed-empty">No data available.</div>
  } @else {

    <!-- ── Top KPI cards ── -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-card--blue">
        <div class="kpi-label">Open Incidents</div>
        <div class="kpi-value">{{ data()!.totalOpen }}</div>
      </div>
      <div class="kpi-card kpi-card--green">
        <div class="kpi-label">Resolved</div>
        <div class="kpi-value">{{ data()!.totalResolved }}</div>
      </div>
      <div class="kpi-card kpi-card--gray">
        <div class="kpi-label">Closed</div>
        <div class="kpi-value">{{ data()!.totalClosed }}</div>
      </div>
      <div class="kpi-card kpi-card--amber">
        <div class="kpi-label">SLA Breaches</div>
        <div class="kpi-value">{{ data()!.slaBreachCount }}</div>
      </div>
      <div class="kpi-card kpi-card--purple">
        <div class="kpi-label">Avg Resolution</div>
        <div class="kpi-value">{{ formatMinutes(data()!.avgResolutionMinutes) }}</div>
      </div>
      <div class="kpi-card kpi-card--teal">
        <div class="kpi-label">CAPA Completion</div>
        <div class="kpi-value">{{ data()!.capaCompletionRate }}%</div>
      </div>
    </div>

    <!-- ── Lower panels ── -->
    <div class="panel-row">

      <!-- By Severity -->
      <div class="panel">
        <div class="panel-title">By Severity</div>
        @for (row of data()!.bySeverity; track row.severity) {
          <div class="bar-row">
            <span [class]="'sev-dot sev-dot--' + sevClass(row.severity)"></span>
            <span class="bar-label">{{ row.label }}</span>
            <div class="bar-track">
              <div class="bar-fill" [class]="'bar-fill--' + sevClass(row.severity)"
                [style.width]="barWidth(row.count, maxSev()) + '%'"></div>
            </div>
            <span class="bar-count">{{ row.count }}</span>
          </div>
        }
        @if (data()!.bySeverity.length === 0) {
          <div class="panel-empty">No incidents in range</div>
        }
      </div>

      <!-- By Status -->
      <div class="panel">
        <div class="panel-title">By Status</div>
        @for (row of data()!.byStatus; track row.status) {
          <div class="bar-row">
            <span class="bar-label bar-label--wide">{{ row.status }}</span>
            <div class="bar-track">
              <div class="bar-fill bar-fill--blue"
                [style.width]="barWidth(row.count, maxStatus()) + '%'"></div>
            </div>
            <span class="bar-count">{{ row.count }}</span>
          </div>
        }
        @if (data()!.byStatus.length === 0) {
          <div class="panel-empty">No incidents in range</div>
        }
      </div>

      <!-- Top Departments -->
      <div class="panel">
        <div class="panel-title">Top Departments</div>
        @for (row of data()!.byDepartment; track row.department) {
          <div class="bar-row">
            <span class="bar-label bar-label--wide">{{ row.department }}</span>
            <div class="bar-track">
              <div class="bar-fill bar-fill--teal"
                [style.width]="barWidth(row.count, maxDept()) + '%'"></div>
            </div>
            <span class="bar-count">{{ row.count }}</span>
          </div>
        }
        @if (data()!.byDepartment.length === 0) {
          <div class="panel-empty">No department data</div>
        }
      </div>

    </div>
  }
</div>
`,
  styles: [`
    .ed-page { padding:1.25rem 1.75rem; max-width:1200px; margin:0 auto; font-family:inherit; }
    .ed-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; }
    .ed-title { font-size:1.4rem; font-weight:700; color:#111827; margin:0 0 3px; }
    .ed-sub { font-size:0.8rem; color:#9ca3af; margin:0; }
    .refresh-btn { padding:6px 14px; font-size:0.78rem; font-weight:500; background:#fff;
      border:1px solid #d1d5db; border-radius:7px; cursor:pointer; color:#374151; }
    .refresh-btn:hover { background:#f9fafb; }
    .ed-empty { padding:3rem; text-align:center; color:#9ca3af; font-size:0.85rem;
      background:#fff; border:1px solid #e5e7eb; border-radius:10px; }

    /* KPI Cards */
    .kpi-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:0.75rem; margin-bottom:1.25rem; }
    @media (max-width:1100px) { .kpi-grid { grid-template-columns:repeat(3,1fr); } }
    @media (max-width:640px)  { .kpi-grid { grid-template-columns:repeat(2,1fr); } }
    .kpi-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px;
      padding:1rem 1.1rem; text-align:center; }
    .kpi-label { font-size:0.72rem; font-weight:600; color:#6b7280; margin-bottom:0.4rem;
      text-transform:uppercase; letter-spacing:.04em; }
    .kpi-value { font-size:1.9rem; font-weight:800; }
    .kpi-card--blue   .kpi-value { color:#2563eb; }
    .kpi-card--green  .kpi-value { color:#16a34a; }
    .kpi-card--gray   .kpi-value { color:#374151; }
    .kpi-card--amber  .kpi-value { color:#d97706; }
    .kpi-card--purple .kpi-value { color:#7c3aed; }
    .kpi-card--teal   .kpi-value { color:#0d9488; }

    /* Panels */
    .panel-row { display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; }
    @media (max-width:900px) { .panel-row { grid-template-columns:1fr; } }
    .panel { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:1rem 1.1rem; }
    .panel-title { font-size:0.78rem; font-weight:700; color:#374151; margin-bottom:0.75rem;
      text-transform:uppercase; letter-spacing:.04em; }
    .panel-empty { font-size:0.78rem; color:#9ca3af; text-align:center; padding:1rem 0; }

    /* Bar rows */
    .bar-row { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.55rem; font-size:0.78rem; }
    .bar-label { color:#374151; width:70px; flex-shrink:0; font-weight:500; overflow:hidden;
      text-overflow:ellipsis; white-space:nowrap; }
    .bar-label--wide { width:110px; }
    .bar-track { flex:1; height:8px; background:#f3f4f6; border-radius:4px; overflow:hidden; }
    .bar-fill { height:100%; border-radius:4px; transition:width .3s ease; }
    .bar-fill--blue  { background:#3b82f6; }
    .bar-fill--teal  { background:#14b8a6; }
    .bar-count { color:#6b7280; width:24px; text-align:right; flex-shrink:0; font-weight:600; }

    .sev-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .bar-fill--critical, .sev-dot--critical { background:#dc2626; }
    .bar-fill--high,     .sev-dot--high     { background:#f97316; }
    .bar-fill--medium,   .sev-dot--medium   { background:#eab308; }
    .bar-fill--low,      .sev-dot--low      { background:#22c55e; }
  `]
})
export class ExecutiveDashboardComponent implements OnInit {
  data    = signal<ExecutiveDashboard | null>(null);
  loading = signal(true);

  constructor(private svc: GovernanceService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getExecutiveDashboard().subscribe({
      next: d  => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatMinutes(m: number): string {
    if (m === 0) return '—';
    if (m < 60)  return `${m}m`;
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return min > 0 ? `${h}h ${min}m` : `${h}h`;
  }

  sevClass(sev: number): string {
    return ['', 'critical', 'high', 'medium', 'low'][sev] ?? 'low';
  }

  barWidth(count: number, max: number): number {
    return max === 0 ? 0 : Math.max(4, Math.round(count / max * 100));
  }

  maxSev():    number { return Math.max(1, ...this.data()!.bySeverity.map(r => r.count)); }
  maxStatus(): number { return Math.max(1, ...this.data()!.byStatus.map(r => r.count)); }
  maxDept():   number { return Math.max(1, ...this.data()!.byDepartment.map(r => r.count)); }
}
