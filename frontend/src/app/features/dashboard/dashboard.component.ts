import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import {
  AnalyticsService,
  AnalyticsKpi,
  IncidentTrendPoint,
  DepartmentPerformance,
  SeverityDistribution,
  ClosureRatePoint,
  RecurringIssue,
} from '../analytics/analytics.service';
import {
  GovernanceService,
  ExecutiveDashboard,
} from '../governance/governance.service';
import { IncidentService, IncidentSummary } from '../incidents/incident.service';
import { ApprovalsService, PendingApproval } from '../approver/approvals.service';

const GOVERNANCE_ROLES = new Set([
  'APPROVER', 'ADMIN',
]);

const IN_PROGRESS_STATUSES = new Set([
  'In Progress', 'Investigation', 'Assigned', 'Triaged', 'Root Cause', 'CAPA',
]);

const OPEN_STATUSES = new Set([
  'Open', 'Submitted', 'In Progress', 'Investigation', 'Assigned', 'Triaged',
  'Root Cause', 'CAPA', 'Pending Reporter Input',
]);

interface DashKpis {
  totalIncidents: number;
  totalTrend: number | null;
  openIncidents: number;
  inProgress: number;
  critical: number;
  slaBreaches: number;
  avgResolutionHours: number;
  avgResolutionTrend: number | null;
  closureRatePct: number;
  closureTrend: number | null;
  incidentsToday: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrap" style="max-width:100%">

      <div class="page-header" style="margin-bottom:1.25rem">
        <div>
          <h1 class="page-title">Incident Dashboard</h1>
          <p style="margin:0;font-size:0.8rem;color:var(--text-muted)">
            Real-time incident monitoring — FactoryShield Platform
            @if (usingFallback()) {
              <span style="color:#9ca3af"> · scoped to your incidents</span>
            }
          </p>
        </div>
        <div class="btn-group">
          <button class="btn btn-secondary btn-sm" (click)="router.navigate(['/my-incidents'])">
            View All Incidents
          </button>
          <button class="btn btn-cta btn-sm" (click)="router.navigate(['/report'])">
            + Report Incident
          </button>
        </div>
      </div>

      @if (loading()) {
        <div style="padding:3rem;text-align:center;color:#9ca3af;font-size:0.85rem">Loading dashboard…</div>
      } @else if (error()) {
        <div style="padding:2rem;text-align:center;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:10px">
          {{ error() }}
          <button type="button" class="btn btn-secondary btn-sm" style="display:block;margin:0.75rem auto 0" (click)="load()">Retry</button>
        </div>
      } @else if (kpis()) {

        <div class="kpi-grid">
          <div class="kpi-tile">
            <div class="kpi-tile__icon" style="background:#eff6ff">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            @if (kpis()!.totalTrend !== null) {
              <span [class]="trendBadgeClass(kpis()!.totalTrend!)">{{ formatTrendShort(kpis()!.totalTrend!) }}</span>
            }
            <div class="kpi-tile__value">{{ kpis()!.totalIncidents }}</div>
            <div class="kpi-tile__sub">{{ periodLabel() }}</div>
            <div class="kpi-tile__label">Total Incidents</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-tile__icon" style="background:#fff7ed">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
            </div>
            <div class="kpi-tile__value">{{ kpis()!.openIncidents }}</div>
            <div class="kpi-tile__sub">Needs attention</div>
            <div class="kpi-tile__label">Open Incidents</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-tile__icon" style="background:#f5f3ff">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div class="kpi-tile__value">{{ kpis()!.inProgress }}</div>
            <div class="kpi-tile__sub">Under investigation</div>
            <div class="kpi-tile__label">In Progress</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-tile__icon" style="background:#fef2f2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </div>
            <div class="kpi-tile__value">{{ kpis()!.critical }}</div>
            <div class="kpi-tile__sub">Immediate action</div>
            <div class="kpi-tile__label">Critical</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-tile">
            <div class="kpi-tile__icon" style="background:#fff7ed">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="kpi-tile__value">{{ kpis()!.slaBreaches }}</div>
            <div class="kpi-tile__sub">Past SLA target</div>
            <div class="kpi-tile__label">SLA Breaches</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-tile__icon" style="background:#ecfdf5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            @if (kpis()!.avgResolutionTrend !== null) {
              <span [class]="trendBadgeClass(-kpis()!.avgResolutionTrend!)">{{ formatTrendShort(kpis()!.avgResolutionTrend!) }}</span>
            }
            <div class="kpi-tile__value">{{ formatHours(kpis()!.avgResolutionHours) }}</div>
            <div class="kpi-tile__sub">{{ periodLabel() }}</div>
            <div class="kpi-tile__label">Avg Resolution</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-tile__icon" style="background:#f0fdf4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            @if (kpis()!.closureTrend !== null) {
              <span [class]="trendBadgeClass(kpis()!.closureTrend!)">{{ formatTrendShort(kpis()!.closureTrend!) }}</span>
            }
            <div class="kpi-tile__value">{{ kpis()!.closureRatePct | number:'1.0-1' }}%</div>
            <div class="kpi-tile__sub">{{ periodLabel() }}</div>
            <div class="kpi-tile__label">Closure Rate</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-tile__icon" style="background:#eef2ff">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <div class="kpi-tile__value">{{ kpis()!.incidentsToday }}</div>
            <div class="kpi-tile__sub">Reported today</div>
            <div class="kpi-tile__label">Incidents Today</div>
          </div>
        </div>

        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-card__hd">
              <span class="chart-card__title">Incident Trend</span>
              <span class="chart-card__period">{{ periodLabel() }}</span>
            </div>
            @if (trend().length === 0) {
              <div style="padding:2rem;text-align:center;color:#9ca3af;font-size:0.82rem">No trend data</div>
            } @else {
              <svg viewBox="0 0 680 180" style="width:100%;height:180px;overflow:visible">
                @for (y of trendYTicks(); track y) {
                  <line x1="50" [attr.y1]="y.y" x2="660" [attr.y2]="y.y" stroke="#f0f3f7" stroke-width="1"/>
                  <text x="40" [attr.y]="y.y + 4" text-anchor="end" font-size="10" fill="#9ca3af">{{ y.label }}</text>
                }
                @for (pt of trendChartPoints(); track pt.label) {
                  <text [attr.x]="pt.x" y="172" text-anchor="middle" font-size="10" fill="#9ca3af">{{ pt.label }}</text>
                }
                @if (trendAreaPath()) {
                  <path [attr.d]="trendAreaPath()!" fill="rgba(220,38,38,0.08)"/>
                  <path [attr.d]="trendLinePath()!" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                }
                @if (closedLinePath()) {
                  <path [attr.d]="closedAreaPath()!" fill="rgba(22,163,74,0.08)"/>
                  <path [attr.d]="closedLinePath()!" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                }
              </svg>
              <div class="chart-legend">
                <span><span class="chart-legend__dot" style="background:#dc2626"></span>Reported</span>
                <span><span class="chart-legend__dot" style="background:#16a34a"></span>Closed</span>
              </div>
            }
          </div>

          <div class="chart-card">
            <div class="chart-card__hd">
              <span class="chart-card__title">Severity Mix</span>
              <span class="chart-card__period">{{ periodLabel() }}</span>
            </div>
            @if (severityTotal() === 0) {
              <div style="padding:2rem;text-align:center;color:#9ca3af;font-size:0.82rem">No severity data</div>
            } @else {
              <div style="display:flex;align-items:center;gap:1.25rem">
                <svg viewBox="0 0 180 180" style="width:130px;height:130px;flex-shrink:0">
                  @for (seg of severitySegments(); track seg.label) {
                    <circle cx="90" cy="90" r="70" fill="none" [attr.stroke]="seg.color" stroke-width="32"
                      [attr.stroke-dasharray]="seg.dash" [attr.stroke-dashoffset]="seg.offset"
                      transform="rotate(-90 90 90)"/>
                  }
                  <text x="90" y="86" text-anchor="middle" font-size="13" font-weight="800" fill="#1a2433">{{ severityTotal() }}</text>
                  <text x="90" y="102" text-anchor="middle" font-size="9" fill="#9ca3af">Total</text>
                </svg>
                <div class="donut-legend">
                  @for (seg of severitySegments(); track seg.label) {
                    <div class="donut-legend__item">
                      <span class="donut-legend__swatch" [style.background]="seg.color"></span>
                      {{ seg.label }} <span class="donut-legend__pct">{{ seg.pct }}%</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <div class="dash-section-row">
          <div class="chart-card">
            <div class="chart-card__hd">
              <span class="chart-card__title">Incidents by Department</span>
              <span class="chart-card__period">{{ periodLabel() }}</span>
            </div>
            @if (departments().length === 0) {
              <div style="padding:2rem;text-align:center;color:#9ca3af;font-size:0.82rem">No department data</div>
            } @else {
              <svg [attr.viewBox]="'0 0 560 ' + deptChartHeight()" style="width:100%" [style.height.px]="deptChartHeight()">
                @for (row of deptChartRows(); track row.dept) {
                  <text x="108" [attr.y]="row.labelY" text-anchor="end" font-size="11" fill="#6b7280">{{ row.dept }}</text>
                  <rect x="112" [attr.y]="row.barY" [attr.width]="row.barWidth" height="18" rx="4" fill="#dc2626" opacity="0.85"/>
                  <text [attr.x]="row.barX" [attr.y]="row.valueY" font-size="10" fill="#374151" font-weight="600">{{ row.count }}</text>
                }
              </svg>
            }
          </div>

          <div style="display:flex;flex-direction:column;gap:0.75rem">
            <div class="ai-card">
              <div class="ai-card__hd">
                <div class="ai-card__icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 9.5H2L7.5 14l-2 7.5L12 17.5l6.5 4-2-7.5L22 9.5h-7.5z"/></svg>
                </div>
                <span class="ai-card__name">Top Recurring Issue</span>
                @if (topRecurring()) { <span class="ai-card__live">Live</span> }
              </div>
              @if (topRecurring()) {
                <p class="ai-card__text">
                  <strong>{{ topRecurring()!.title }}</strong> in {{ topRecurring()!.department }}
                  — {{ topRecurring()!.count }} occurrences
                  @if (topRecurring()!.trend !== 0) {
                    ({{ topRecurring()!.trend > 0 ? '↑' : '↓' }} {{ topRecurring()!.trend | number:'1.0-0' }}% trend)
                  }.
                </p>
                <a class="ai-card__link" style="cursor:pointer" (click)="router.navigate(['/analytics'])">View Analytics ›</a>
              } @else {
                <p class="ai-card__text">No recurring issues detected in the selected period.</p>
              }
            </div>

            <div class="chart-card" style="padding:1.1rem 1.15rem;flex:1">
              <div class="qa-title">Quick Actions</div>
              <div class="qa-grid">
                <button class="qa-btn qa-btn-red" (click)="router.navigate(['/report'])">+ Report Incident</button>
                <button class="qa-btn qa-btn-dark" (click)="router.navigate(['/my-incidents'])">View Open</button>
                <button class="qa-btn qa-btn-outline" (click)="router.navigate(['/approver/queue'])">Assign Queue</button>
                <button class="qa-btn qa-btn-outline" (click)="router.navigate(['/approvals'])">Approvals</button>
              </div>
            </div>
          </div>
        </div>

        <div class="dash-section-row">
          <div class="chart-card">
            <div class="chart-card__hd">
              <span class="chart-card__title">Recent Incidents</span>
              <a style="font-size:0.78rem;font-weight:700;color:#dc2626;text-decoration:none;cursor:pointer"
                (click)="router.navigate(['/my-incidents'])">View all ↗</a>
            </div>
            @if (recentIncidents().length === 0) {
              <div style="padding:1.5rem;text-align:center;color:#9ca3af;font-size:0.82rem">No incidents found</div>
            } @else {
              <ul class="incident-list">
                @for (inc of recentIncidents(); track inc.id) {
                  <li class="incident-item" style="cursor:pointer" (click)="openIncident(inc)">
                    <div class="incident-item__body">
                      <div class="incident-meta">
                        <span class="inc-id">{{ inc.incidentReference }}</span>
                        <span [class]="'sev-badge ' + sevBadgeClass(inc.severity)">{{ sevLabel(inc.severity) }}</span>
                      </div>
                      <div class="inc-title">{{ inc.category }}</div>
                      <div class="inc-sub">{{ inc.department ?? '—' }} · {{ inc.createdAt | date:'MMM d' }} · {{ inc.reportedBy ?? '—' }}</div>
                    </div>
                    <span [class]="'status-pill ' + statusClass(inc.displayStatus)">{{ inc.displayStatus }}</span>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="chart-card">
            <div class="chart-card__hd">
              <span class="chart-card__title">Pending Approvals</span>
              @if (pendingApprovals().length > 0) {
                <span class="pa-count">{{ pendingApprovals().length }}</span>
              }
            </div>
            @if (pendingApprovals().length === 0) {
              <div style="padding:1.5rem;text-align:center;color:#9ca3af;font-size:0.82rem">No pending approvals</div>
            } @else {
              <ul class="approval-list">
                @for (a of pendingApprovals(); track a.incidentId) {
                  <li class="approval-item">
                    <div class="approval-hd">
                      <span class="inc-id">{{ a.incidentReference }}</span>
                    </div>
                    <div class="approval-title">{{ a.approvalTitle }}</div>
                    <div class="approval-by">{{ a.title }}</div>
                    <div class="approval-btns">
                      <button type="button" class="btn-review" (click)="router.navigate(['/approvals'])">Review</button>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private analytics = inject(AnalyticsService);
  private governance = inject(GovernanceService);
  private incidents = inject(IncidentService);
  private approvals = inject(ApprovalsService);
  private auth = inject(AuthService);
  readonly router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  usingFallback = signal(false);
  period = signal('6m');

  kpis = signal<DashKpis | null>(null);
  trend = signal<IncidentTrendPoint[]>([]);
  closure = signal<ClosureRatePoint[]>([]);
  departments = signal<DepartmentPerformance[]>([]);
  severity = signal<SeverityDistribution | null>(null);
  recurring = signal<RecurringIssue[]>([]);
  recentIncidents = signal<IncidentSummary[]>([]);
  pendingApprovals = signal<PendingApproval[]>([]);

  topRecurring = computed(() => this.recurring()[0] ?? null);

  severityTotal = computed(() => {
    const s = this.severity();
    if (!s) return 0;
    return s.low + s.medium + s.high + s.critical;
  });

  severitySegments = computed(() => {
    const s = this.severity();
    const total = this.severityTotal();
    if (!s || total === 0) return [];
    const circumference = 2 * Math.PI * 70;
    const items = [
      { label: 'Low (L4)', count: s.low, color: '#16a34a' },
      { label: 'Medium (L3)', count: s.medium, color: '#d97706' },
      { label: 'High (L2)', count: s.high, color: '#ea580c' },
      { label: 'Critical (L1)', count: s.critical, color: '#dc2626' },
    ];
    let offset = 0;
    return items.filter(i => i.count > 0).map(i => {
      const pct = Math.round(i.count / total * 100);
      const len = (i.count / total) * circumference;
      const seg = { ...i, pct, dash: `${len} ${circumference - len}`, offset: -offset };
      offset += len;
      return seg;
    });
  });

  trendMax = computed(() => {
    const reported = this.trend().map(p => p.reported);
    const closed = this.closure().map(p => p.closed);
    return Math.max(1, ...reported, ...closed, 1);
  });

  trendChartPoints = computed(() => {
    const pts = this.trend();
    if (pts.length === 0) return [];
    const xStart = 90;
    const xEnd = 648;
    const step = pts.length === 1 ? 0 : (xEnd - xStart) / (pts.length - 1);
    return pts.map((p, i) => ({ label: p.month, x: xStart + step * i }));
  });

  trendYTicks = computed(() => {
    const max = this.trendMax();
    const steps = 4;
    const result = [];
    for (let i = 0; i <= steps; i++) {
      const val = Math.round(max - (max / steps) * i);
      const y = 20 + (140 / steps) * i;
      result.push({ label: val, y });
    }
    return result;
  });

  trendLinePath = computed(() => this.buildLinePath(this.trend().map(p => p.reported)));
  trendAreaPath = computed(() => this.buildAreaPath(this.trend().map(p => p.reported)));
  closedLinePath = computed(() => {
    const closedByMonth = this.closure();
    if (closedByMonth.length === 0) return null;
    const values = this.trend().map(t => {
      const match = closedByMonth.find(c => c.month === t.month);
      return match?.closed ?? 0;
    });
    return this.buildLinePath(values);
  });
  closedAreaPath = computed(() => {
    const closedByMonth = this.closure();
    if (closedByMonth.length === 0) return null;
    const values = this.trend().map(t => {
      const match = closedByMonth.find(c => c.month === t.month);
      return match?.closed ?? 0;
    });
    return this.buildAreaPath(values);
  });

  deptChartHeight = computed(() => Math.max(120, this.departments().length * 32 + 40));

  deptChartRows = computed(() => {
    const rows = this.departments().slice(0, 8);
    const max = Math.max(1, ...rows.map(r => r.incidents));
    const scale = 400 / max;
    return rows.map((r, i) => {
      const barWidth = Math.max(4, Math.round(r.incidents * scale));
      const y = 24 + i * 32;
      return {
        dept: r.dept,
        count: r.incidents,
        labelY: y,
        barY: y - 13,
        barWidth,
        barX: 112 + barWidth + 8,
        valueY: y + 1,
      };
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const role = this.auth.currentRole()?.toUpperCase() ?? '';
    if (GOVERNANCE_ROLES.has(role)) {
      this.loadAnalytics();
    } else {
      this.loadFallback(role);
    }

    this.loadRecentIncidents(role);
    // /approvals/pending requires the GovernanceOnly policy server-side —
    // skip it for other roles instead of firing a guaranteed 403.
    if (GOVERNANCE_ROLES.has(role)) {
      this.loadPendingApprovals();
    }
  }

  periodLabel(): string {
    return { '3m': 'Last 3 months', '6m': 'Last 6 months', '12m': 'Last 12 months' }[this.period()] ?? this.period();
  }

  private loadAnalytics(): void {
    const p = this.period();
    forkJoin({
      kpi: this.analytics.getKpi(p),
      trend: this.analytics.getIncidentTrend(p),
      departments: this.analytics.getDepartmentPerformance(p),
      severity: this.analytics.getSeverityDistribution(p),
      recurring: this.analytics.getRecurringIssues(p),
      closure: this.analytics.getClosureRate(p),
      executive: this.governance.getExecutiveDashboard().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ kpi, trend, departments, severity, recurring, closure, executive }) => {
        this.usingFallback.set(false);
        this.trend.set(trend);
        this.closure.set(closure);
        this.departments.set(departments);
        this.severity.set(severity);
        this.recurring.set(recurring);
        this.kpis.set(this.buildKpisFromAnalytics(kpi, severity, closure, executive));
        this.loading.set(false);
      },
      error: () => {
        const role = this.auth.currentRole()?.toUpperCase() ?? '';
        this.loadFallback(role);
      },
    });
  }

  private loadFallback(role: string): void {
    const obs =
      role === 'RESOLVER' ? this.incidents.getAssignedIncidents()
      : role === 'APPROVER' ? this.incidents.getApproverQueue()
      : this.incidents.getMyIncidents();

    obs.subscribe({
      next: list => {
        this.usingFallback.set(true);
        this.trend.set([]);
        this.closure.set([]);
        this.departments.set(this.buildDeptFromIncidents(list));
        this.severity.set(this.buildSeverityFromIncidents(list));
        this.recurring.set([]);
        this.kpis.set(this.buildKpisFromIncidents(list));
        this.recentIncidents.set([...list].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard data.');
        this.loading.set(false);
      },
    });
  }

  private loadRecentIncidents(role: string): void {
    const obs =
      role === 'RESOLVER' ? this.incidents.getAssignedIncidents()
      : role === 'APPROVER' ? this.incidents.getApproverQueue()
      : this.incidents.getMyIncidents();

    obs.subscribe({
      next: list => {
        const sorted = [...list].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.recentIncidents.set(sorted.slice(0, 5));
        this.patchIncidentsToday(sorted);
      },
      error: () => this.recentIncidents.set([]),
    });
  }

  private patchIncidentsToday(list = this.recentIncidents()): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = list.filter(i => {
      const d = new Date(i.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
    this.kpis.update(k => k ? { ...k, incidentsToday: count } : k);
  }

  private loadPendingApprovals(): void {
    this.approvals.getPending().pipe(catchError(() => of([]))).subscribe({
      next: list => this.pendingApprovals.set(list.slice(0, 3)),
    });
  }

  private buildKpisFromAnalytics(
    kpi: AnalyticsKpi,
    severity: SeverityDistribution,
    closure: ClosureRatePoint[],
    executive: ExecutiveDashboard | null,
  ): DashKpis {
    const latestClosure = closure.length ? closure[closure.length - 1] : null;
    const prevClosure = closure.length > 1 ? closure[closure.length - 2] : null;
    const inProgress = executive?.byStatus
      .filter(s => IN_PROGRESS_STATUSES.has(s.status))
      .reduce((sum, s) => sum + s.count, 0) ?? 0;

    return {
      totalIncidents: kpi.totalIncidents,
      totalTrend: kpi.totalIncidentsTrend,
      openIncidents: executive?.totalOpen ?? 0,
      inProgress,
      critical: severity.critical,
      slaBreaches: executive?.slaBreachCount ?? 0,
      avgResolutionHours: kpi.avgResolutionHours,
      avgResolutionTrend: kpi.avgResolutionTrend,
      closureRatePct: latestClosure?.closureRatePct ?? kpi.slaCompliancePct,
      closureTrend: prevClosure && latestClosure
        ? latestClosure.closureRatePct - prevClosure.closureRatePct
        : kpi.slaComplianceTrend,
      incidentsToday: 0,
    };
  }

  private buildKpisFromIncidents(list: IncidentSummary[]): DashKpis {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      totalIncidents: list.length,
      totalTrend: null,
      openIncidents: list.filter(i => OPEN_STATUSES.has(i.displayStatus)).length,
      inProgress: list.filter(i => IN_PROGRESS_STATUSES.has(i.displayStatus)).length,
      critical: list.filter(i => i.severity === 1).length,
      slaBreaches: list.filter(i => i.dueDate && new Date(i.dueDate) < new Date() && i.displayStatus !== 'Closed').length,
      avgResolutionHours: 0,
      avgResolutionTrend: null,
      closureRatePct: list.length
        ? Math.round(list.filter(i => i.displayStatus === 'Closed' || i.displayStatus === 'Resolved').length / list.length * 1000) / 10
        : 0,
      closureTrend: null,
      incidentsToday: list.filter(i => {
        const d = new Date(i.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }).length,
    };
  }

  private buildSeverityFromIncidents(list: IncidentSummary[]): SeverityDistribution {
    return {
      critical: list.filter(i => i.severity === 1).length,
      high: list.filter(i => i.severity === 2).length,
      medium: list.filter(i => i.severity === 3).length,
      low: list.filter(i => i.severity === 4).length,
    };
  }

  private buildDeptFromIncidents(list: IncidentSummary[]): DepartmentPerformance[] {
    const map = new Map<string, number>();
    for (const inc of list) {
      const dept = inc.department?.trim() || 'Unknown';
      map.set(dept, (map.get(dept) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([dept, incidents]) => ({ dept, incidents, resolved: 0 }))
      .sort((a, b) => b.incidents - a.incidents);
  }

  private buildLinePath(values: number[]): string | null {
    if (values.length === 0) return null;
    const pts = this.coordsForValues(values);
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  private buildAreaPath(values: number[]): string | null {
    const line = this.buildLinePath(values);
    if (!line || values.length === 0) return null;
    const pts = this.coordsForValues(values);
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${line} L ${last.x} 160 L ${first.x} 160 Z`;
  }

  private coordsForValues(values: number[]): { x: number; y: number }[] {
    const max = this.trendMax();
    const xStart = 90;
    const xEnd = 648;
    const step = values.length === 1 ? 0 : (xEnd - xStart) / (values.length - 1);
    return values.map((v, i) => ({
      x: xStart + step * i,
      y: 160 - (v / max) * 120,
    }));
  }

  openIncident(inc: IncidentSummary): void {
    this.router.navigate(['/incidents', inc.incidentReference]);
  }

  formatHours(h: number): string {
    if (!h || h === 0) return '—';
    if (h < 1) return `${Math.round(h * 60)}m`;
    return h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
  }

  formatTrendShort(v: number): string {
    const sign = v > 0 ? '↗ +' : v < 0 ? '↘ ' : '— ';
    return `${sign}${Math.abs(v).toFixed(1)}%`;
  }

  trendBadgeClass(v: number): string {
    if (v > 0) return 'kpi-tile__trend trend-up';
    if (v < 0) return 'kpi-tile__trend trend-dn';
    return 'kpi-tile__trend';
  }

  sevLabel(v: number): string {
    return ['', 'Critical', 'High', 'Medium', 'Low'][v] ?? 'Low';
  }

  sevBadgeClass(v: number): string {
    return ['', 'sev-critical', 'sev-high', 'sev-medium', 'sev-low'][v] ?? 'sev-low';
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      Open: 'st-open', Submitted: 'st-open',
      'In Progress': 'st-inprogress', Investigation: 'st-investigation',
      Closed: 'st-closed', Resolved: 'st-closed',
    };
    return map[s] ?? 'st-open';
  }
}
