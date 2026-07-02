import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ApexOptions } from 'apexcharts';
import { ChartComponent } from '../../shared/components/chart.component';
import {
  AnalyticsService,
  AnalyticsKpi,
  IncidentTrendPoint,
  DepartmentPerformance,
  SeverityDistribution,
  RecurringIssue,
  RootCauseItem,
  ClosureRatePoint,
  ResolutionTimeBreakdown,
} from './analytics.service';

interface Pill { label: string; target: string; }

const PILLS: Pill[] = [
  { label: 'Incident Trend', target: 'sec-trend' },
  { label: 'Department Performance', target: 'sec-dept' },
  { label: 'Root Cause Analysis', target: 'sec-rootcause' },
  { label: 'Repeat Incidents', target: 'sec-recurring' },
  { label: 'CAPA Report', target: 'sec-recurring' },
  { label: 'Resolution Time', target: 'sec-resolution' },
  { label: 'SLA Compliance', target: 'sec-closure' },
  { label: 'Factory Comparison', target: 'sec-dept' },
];

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BASE_CHART = { fontFamily: FONT, toolbar: { show: false }, animations: { speed: 400 } };

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  template: `
<div class="an-page">

  <!-- Header -->
  <div class="an-hd">
    <div>
      <h1 class="an-title">Analytics &amp; Reports</h1>
      <p class="an-sub">Comprehensive incident intelligence — {{ periodLabel() }}</p>
    </div>
    <div class="an-actions">
      <select class="period-select" [value]="period()" (change)="onPeriodChange($event)">
        <option value="3m">Last 3 months</option>
        <option value="6m">Last 6 months</option>
        <option value="12m">Last 12 months</option>
      </select>
      <button class="act-btn" (click)="toggleInsights()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
        </svg>
        AI Insights
      </button>
      <button class="act-btn" (click)="download('pdf')" [disabled]="exporting()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
        </svg>
        Export PDF
      </button>
      <button class="act-btn" (click)="download('excel')" [disabled]="exporting()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
        </svg>
        Excel
      </button>
    </div>
  </div>

  <!-- Tab pills -->
  <div class="pill-row">
    @for (p of pills; track p.label) {
      <button [class]="'pill' + (activePill() === p.label ? ' pill--active' : '')"
        (click)="selectPill(p)">{{ p.label }}</button>
    }
  </div>

  @if (insightsOpen()) {
    <div class="insight-box">
      <div class="insight-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
        </svg>
      </div>
      <div class="insight-text">{{ insightSummary() }}</div>
    </div>
  }

  @if (loading()) {
    <div class="an-empty">Loading analytics…</div>
  } @else if (error()) {
    <div class="an-empty an-empty--error">{{ error() }}</div>
  } @else {

    <!-- KPI cards -->
    @if (kpi(); as k) {
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Incidents</div>
          <div class="kpi-value">{{ k.totalIncidents }}</div>
          <div [class]="trendClass(k.totalIncidentsTrend)">{{ formatTrend(k.totalIncidentsTrend) }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Avg Resolution</div>
          <div class="kpi-value">{{ formatHours(k.avgResolutionHours) }}</div>
          <div [class]="trendClass(-k.avgResolutionTrend)">{{ formatHoursTrend(k.avgResolutionTrend) }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">SLA Compliance</div>
          <div class="kpi-value">{{ k.slaCompliancePct | number:'1.0-1' }}%</div>
          <div [class]="trendClass(k.slaComplianceTrend)">{{ formatTrend(k.slaComplianceTrend) }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Recurring Rate</div>
          <div class="kpi-value">{{ k.recurringRatePct | number:'1.0-1' }}%</div>
          <div [class]="trendClass(-k.recurringRateTrend)">{{ formatTrend(k.recurringRateTrend) }}</div>
        </div>
      </div>
    }

    <!-- Row 1 -->
    <div class="chart-grid">
      <div class="panel" id="sec-trend">
        <div class="panel-title">Incident Trend vs Closures</div>
        <app-chart [options]="trendChart()" />
      </div>
      <div class="panel" id="sec-dept">
        <div class="panel-title">Department Performance</div>
        @if (departments().length === 0) { <div class="panel-empty">No department data</div> }
        @else { <app-chart [options]="deptChart()" /> }
      </div>
    </div>

    <!-- Row 2 -->
    <div class="chart-grid">
      <div class="panel" id="sec-rootcause">
        <div class="panel-title">Root Cause Distribution</div>
        @if (rootCause().length === 0) { <div class="panel-empty">No root cause data</div> }
        @else { <app-chart [options]="rootCauseChart()" /> }
      </div>
      <div class="panel" id="sec-closure">
        <div class="panel-title">Monthly Closure Rate %</div>
        @if (closureRate().length === 0) { <div class="panel-empty">No closure data</div> }
        @else { <app-chart [options]="closureChart()" /> }
      </div>
    </div>

    <!-- Row 3 -->
    <div class="chart-grid">
      <div class="panel" id="sec-resolution">
        <div class="panel-title">Avg Resolution Time (hours)</div>
        @if ((resolution()?.byDepartment?.length ?? 0) === 0) { <div class="panel-empty">No resolution data</div> }
        @else { <app-chart [options]="resolutionChart()" /> }
      </div>
      <div class="panel" id="sec-severity">
        <div class="panel-title">Severity Distribution</div>
        <app-chart [options]="severityChart()" />
      </div>
    </div>

    <!-- Recurring issues -->
    <div class="panel" id="sec-recurring">
      <div class="panel-hd">
        <div class="panel-title">Top Recurring Issues</div>
        <span class="panel-note">Last 90 days</span>
      </div>
      @if (recurring().length === 0) {
        <div class="panel-empty">No recurring issues in period</div>
      } @else {
        <div class="rec-list">
          @for (r of recurring(); track r.rank) {
            <div class="rec-row">
              <div class="rec-rank">{{ r.rank }}</div>
              <div class="rec-main">
                <div class="rec-title">{{ r.title }}</div>
                <div class="rec-dept">{{ r.department }}</div>
              </div>
              <div class="rec-count">
                <div class="rec-count-val">{{ r.count }}</div>
                <div class="rec-count-lbl">incidents</div>
              </div>
              <span [class]="'rec-trend ' + (r.trend > 0 ? 'rec-trend--up' : r.trend < 0 ? 'rec-trend--down' : 'rec-trend--flat')">
                {{ r.trend > 0 ? '+' : '' }}{{ r.trend }}
              </span>
            </div>
          }
        </div>
      }
    </div>
  }
</div>
`,
  styles: [`
    :host { --brand:#D4183D; --ink:#030213; --muted:#717182; --border:#ECECF0;
      --bg:#F3F3F5; display:block; }
    .an-page { padding:1.25rem 1.75rem; max-width:1320px; margin:0 auto;
      font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      background:var(--bg); min-height:100%; }

    .an-hd { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem;
      margin-bottom:1rem; flex-wrap:wrap; }
    .an-title { font-size:1.4rem; font-weight:700; color:var(--ink); margin:0 0 3px; }
    .an-sub { font-size:0.82rem; color:var(--muted); margin:0; }
    .an-actions { display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; }
    .period-select { padding:7px 10px; font-size:0.78rem; border:1px solid #d1d5db;
      border-radius:8px; background:#fff; color:#374151; font-family:inherit; }
    .act-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 13px; font-size:0.78rem;
      font-weight:500; background:#fff; border:1px solid #d1d5db; border-radius:8px; cursor:pointer;
      color:#374151; font-family:inherit; }
    .act-btn svg { width:14px; height:14px; }
    .act-btn:hover:not(:disabled) { background:#f9fafb; }
    .act-btn:disabled { opacity:0.5; cursor:not-allowed; }

    .pill-row { display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .pill { padding:6px 14px; font-size:0.76rem; font-weight:500; border:1px solid var(--border);
      border-radius:999px; background:#fff; color:#4b5563; cursor:pointer; font-family:inherit;
      transition:all .12s; }
    .pill:hover { border-color:#cbd5e1; }
    .pill--active { background:var(--brand); border-color:var(--brand); color:#fff; }

    .insight-box { display:flex; gap:0.75rem; align-items:flex-start; background:#faf5ff;
      border:1px solid #ede9fe; border-radius:12px; padding:1rem 1.15rem; margin-bottom:1.25rem; }
    .insight-icon { width:30px; height:30px; border-radius:8px; background:#8b5cf6; color:#fff;
      display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .insight-icon svg { width:16px; height:16px; }
    .insight-text { font-size:0.83rem; color:#5b21b6; line-height:1.55; }

    .an-empty { padding:3rem; text-align:center; color:var(--muted); font-size:0.85rem;
      background:#fff; border:1px solid var(--border); border-radius:12px; }
    .an-empty--error { color:#dc2626; }

    .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0.9rem; margin-bottom:0.9rem; }
    @media (max-width:900px) { .kpi-grid { grid-template-columns:repeat(2,1fr); } }
    .kpi-card { background:#fff; border:1px solid var(--border); border-radius:12px; padding:1.1rem 1.2rem; }
    .kpi-label { font-size:0.72rem; font-weight:500; color:var(--muted); margin-bottom:0.5rem; }
    .kpi-value { font-size:1.85rem; font-weight:700; color:var(--ink); margin-bottom:0.35rem; line-height:1; }
    .kpi-trend { font-size:0.72rem; font-weight:600; display:inline-flex; align-items:center; gap:3px; }
    .kpi-trend--up::before   { content:'▲'; font-size:0.6rem; }
    .kpi-trend--down::before { content:'▼'; font-size:0.6rem; }
    .kpi-trend--up   { color:#16a34a; }
    .kpi-trend--down { color:#dc2626; }
    .kpi-trend--flat { color:#9ca3af; }

    .chart-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.9rem; margin-bottom:0.9rem; }
    @media (max-width:900px) { .chart-grid { grid-template-columns:1fr; } }
    .panel { background:#fff; border:1px solid var(--border); border-radius:12px; padding:1.1rem 1.2rem; }
    .panel-hd { display:flex; align-items:center; justify-content:space-between; }
    .panel-title { font-size:0.92rem; font-weight:700; color:var(--ink); margin-bottom:0.5rem; }
    .panel-hd .panel-title { margin-bottom:0; }
    .panel-note { font-size:0.7rem; color:#9ca3af; }
    .panel-empty { font-size:0.8rem; color:#9ca3af; text-align:center; padding:2.5rem 0; }

    .rec-list { margin-top:0.75rem; display:flex; flex-direction:column; }
    .rec-row { display:flex; align-items:center; gap:0.9rem; padding:0.7rem 0; border-bottom:1px solid #f3f4f6; }
    .rec-row:last-child { border-bottom:none; }
    .rec-rank { width:22px; height:22px; border-radius:50%; background:#fef2f2; color:var(--brand);
      font-size:0.72rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .rec-main { flex:1; min-width:0; }
    .rec-title { font-size:0.83rem; font-weight:600; color:var(--ink); }
    .rec-dept { font-size:0.72rem; color:var(--muted); }
    .rec-count { text-align:right; }
    .rec-count-val { font-size:0.9rem; font-weight:700; color:var(--ink); }
    .rec-count-lbl { font-size:0.65rem; color:#9ca3af; }
    .rec-trend { font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px; min-width:34px; text-align:center; }
    .rec-trend--up   { background:#fef2f2; color:#dc2626; }
    .rec-trend--down { background:#f0fdf4; color:#16a34a; }
    .rec-trend--flat { background:#f3f4f6; color:#9ca3af; }
  `],
})
export class AnalyticsComponent implements OnInit {
  readonly pills = PILLS;
  period = signal('6m');
  activePill = signal(PILLS[0].label);
  insightsOpen = signal(false);
  loading = signal(true);
  exporting = signal(false);
  error = signal<string | null>(null);

  kpi = signal<AnalyticsKpi | null>(null);
  trend = signal<IncidentTrendPoint[]>([]);
  departments = signal<DepartmentPerformance[]>([]);
  severity = signal<SeverityDistribution | null>(null);
  recurring = signal<RecurringIssue[]>([]);
  rootCause = signal<RootCauseItem[]>([]);
  closureRate = signal<ClosureRatePoint[]>([]);
  resolution = signal<ResolutionTimeBreakdown | null>(null);

  periodLabel = computed(() => {
    switch (this.period()) {
      case '3m': return 'Last 3 months';
      case '12m': return 'Last 12 months';
      default: return 'Last 6 months';
    }
  });

  // ── Chart option builders ────────────────────────────────────────────────
  trendChart = computed<ApexOptions>(() => ({
    chart: { ...BASE_CHART, type: 'area', height: 260 },
    series: [{ name: 'Reported', data: this.trend().map(t => t.reported) }],
    xaxis: { categories: this.trend().map(t => t.month) },
    colors: ['#D4183D'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.35, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#f1f1f4', strokeDashArray: 4 },
    legend: { show: true, position: 'bottom' },
  }));

  deptChart = computed<ApexOptions>(() => ({
    chart: { ...BASE_CHART, type: 'bar', height: 260 },
    series: [
      { name: 'Incidents', data: this.departments().map(d => d.incidents) },
      { name: 'Resolved', data: this.departments().map(d => d.resolved) },
    ],
    xaxis: { categories: this.departments().map(d => d.dept) },
    colors: ['#F4A0AB', '#4ADE80'],
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#f1f1f4', strokeDashArray: 4 },
    legend: { show: true, position: 'bottom' },
  }));

  rootCauseChart = computed<ApexOptions>(() => ({
    chart: { ...BASE_CHART, type: 'bar', height: 260 },
    series: [{ name: 'Incidents', data: this.rootCause().map(r => r.count) }],
    xaxis: { categories: this.rootCause().map(r => r.category) },
    colors: ['#8b5cf6'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#f1f1f4', strokeDashArray: 4 },
    legend: { show: false },
  }));

  closureChart = computed<ApexOptions>(() => ({
    chart: { ...BASE_CHART, type: 'line', height: 260 },
    series: [{ name: 'Closure Rate', data: this.closureRate().map(c => Math.round(c.closureRatePct)) }],
    xaxis: { categories: this.closureRate().map(c => c.month) },
    yaxis: { min: 0, max: 100, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
    colors: ['#f59e0b'],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 4, colors: ['#f59e0b'] },
    dataLabels: { enabled: false },
    grid: { borderColor: '#f1f1f4', strokeDashArray: 4 },
    legend: { show: false },
  }));

  resolutionChart = computed<ApexOptions>(() => {
    const groups = this.resolution()?.byDepartment ?? [];
    return {
      chart: { ...BASE_CHART, type: 'area', height: 260 },
      series: [{ name: 'Avg Hours', data: groups.map(g => Math.round(g.avgHours * 10) / 10) }],
      xaxis: { categories: groups.map(g => g.group) },
      colors: ['#2563eb'],
      stroke: { curve: 'smooth', width: 2.5 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.4, opacityTo: 0.03 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f4', strokeDashArray: 4 },
      legend: { show: false },
    };
  });

  severityChart = computed<ApexOptions>(() => {
    const s = this.severity();
    const series = [s?.low ?? 0, s?.medium ?? 0, s?.high ?? 0, s?.critical ?? 0];
    const total = series.reduce((a, b) => a + b, 0) || 1;
    return {
      chart: { ...BASE_CHART, type: 'donut', height: 260 },
      series,
      labels: ['Low', 'Medium', 'High', 'Critical'],
      colors: ['#22c55e', '#eab308', '#f97316', '#dc2626'],
      dataLabels: { enabled: false },
      legend: {
        show: true, position: 'right', fontFamily: FONT,
        // Mirror the reference: show the share next to each severity label.
        formatter: (label: string, opts?: { seriesIndex: number }) =>
          `${label}  ${Math.round((series[opts?.seriesIndex ?? 0] / total) * 100)}%`,
      },
      plotOptions: { pie: { donut: { size: '68%' } } },
      stroke: { width: 0 },
    };
  });

  insightSummary = computed(() => {
    const k = this.kpi();
    if (!k) return 'No data available for the selected period.';
    const topDept = [...this.departments()].sort((a, b) => b.incidents - a.incidents)[0];
    const topCause = [...this.rootCause()].sort((a, b) => b.count - a.count)[0];
    const parts = [
      `${k.totalIncidents} incidents this period (${this.formatTrend(k.totalIncidentsTrend)}).`,
      `SLA compliance at ${k.slaCompliancePct.toFixed(1)}% with an average resolution of ${this.formatHours(k.avgResolutionHours)}.`,
    ];
    if (topDept) parts.push(`${topDept.dept} reported the most incidents (${topDept.incidents}).`);
    if (topCause) parts.push(`Leading root cause: ${topCause.category}.`);
    if (k.recurringRatePct > 20) parts.push(`Recurring rate is elevated at ${k.recurringRatePct.toFixed(1)}% — review the top repeat issues below.`);
    return parts.join(' ');
  });

  constructor(private svc: AnalyticsService) {}

  ngOnInit() { this.load(); }

  onPeriodChange(e: Event) {
    this.period.set((e.target as HTMLSelectElement).value);
    this.load();
  }

  selectPill(p: Pill) {
    this.activePill.set(p.label);
    document.getElementById(p.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleInsights() { this.insightsOpen.update(v => !v); }

  load() {
    const p = this.period();
    this.loading.set(true);
    this.error.set(null);
    let pending = 8;
    let failed = false;

    const done = () => { if (--pending === 0) this.loading.set(false); };
    const onErr = () => {
      if (!failed) { failed = true; this.error.set('Failed to load analytics. Governance role required.'); }
      done();
    };

    this.svc.getKpi(p).subscribe({ next: d => { this.kpi.set(d); done(); }, error: onErr });
    this.svc.getIncidentTrend(p).subscribe({ next: d => { this.trend.set(d); done(); }, error: onErr });
    this.svc.getDepartmentPerformance(p).subscribe({ next: d => { this.departments.set(d); done(); }, error: onErr });
    this.svc.getSeverityDistribution(p).subscribe({ next: d => { this.severity.set(d); done(); }, error: onErr });
    this.svc.getRecurringIssues(p).subscribe({ next: d => { this.recurring.set(d); done(); }, error: onErr });
    this.svc.getRootCauseDistribution(p).subscribe({ next: d => { this.rootCause.set(d); done(); }, error: onErr });
    this.svc.getClosureRate(p).subscribe({ next: d => { this.closureRate.set(d); done(); }, error: onErr });
    this.svc.getResolutionTime(p).subscribe({ next: d => { this.resolution.set(d); done(); }, error: onErr });
  }

  download(type: 'pdf' | 'excel') {
    this.exporting.set(true);
    const p = this.period();
    const obs = type === 'pdf' ? this.svc.exportPdf(p) : this.svc.exportExcel(p);
    obs.subscribe({
      next: blob => {
        const ext = type === 'pdf' ? 'pdf' : 'csv';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${p}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  formatHours(h: number): string {
    if (!h || h === 0) return '—';
    if (h < 1) return `${Math.round(h * 60)}m`;
    return h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
  }

  formatTrend(v: number): string {
    if (v === 0) return 'no change vs last period';
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}% vs last period`;
  }

  /** Avg-resolution trend is an absolute hours delta (not a percentage). */
  formatHoursTrend(v: number): string {
    if (v === 0) return 'no change vs last period';
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}h vs last period`;
  }

  trendClass(v: number): string {
    if (v > 0) return 'kpi-trend kpi-trend--up';
    if (v < 0) return 'kpi-trend kpi-trend--down';
    return 'kpi-trend kpi-trend--flat';
  }
}
