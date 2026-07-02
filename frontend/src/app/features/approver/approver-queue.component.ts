import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IncidentService, IncidentSummary } from '../incidents/incident.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-approver-queue',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="pa-page">

  <div class="pa-hd">
    <div>
      <h1 class="pa-title">Approver Queue</h1>
      <p class="pa-sub">{{ incidents().length }} incident(s) awaiting action</p>
    </div>
    <button class="refresh-btn" (click)="load()">↺ Refresh</button>
  </div>

  @if (loading()) {
    <div class="pa-empty">Loading queue…</div>
  } @else if (incidents().length === 0) {
    <div class="pa-empty">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db"
        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
        style="display:block;margin:0 auto 0.75rem">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect width="6" height="4" x="9" y="3" rx="2"/><path d="m9 14 2 2 4-4"/>
      </svg>
      No incidents in queue
    </div>
  } @else {
    <div class="inc-table-wrap">
      <table class="inc-table">
        <thead>
          <tr>
            <th>INCIDENT NO</th>
            <th>CATEGORY</th>
            <th>SEVERITY</th>
            <th>STATUS</th>
            <th>REPORTER</th>
            <th>SLA</th>
            <th>CLAIM</th>
            <th>CREATED</th>
          </tr>
        </thead>
        <tbody>
          @for (inc of incidents(); track inc.id) {
            <tr [class]="'inc-row' + (isCriticalOrBreached(inc) ? ' inc-row--critical' : '')"
              (click)="openDetail(inc)">
              <td class="inc-no-cell">
                {{ inc.incidentReference }}
                @if (isCriticalOrBreached(inc)) {
                  <span class="sla-alert">!</span>
                }
              </td>
              <td><span class="cat-tag">{{ inc.category }}</span></td>
              <td><span [class]="'sev-pill ' + sevClass(inc.severity)">{{ sevLabel(inc.severity) }}</span></td>
              <td><span [class]="'stat-pill ' + statClass(inc.displayStatus)">{{ inc.displayStatus }}</span></td>
              <td>
                @if (inc.isConfidential) {
                  <span class="conf-badge">🔒 Confidential</span>
                } @else {
                  <span class="reporter-text">{{ inc.reporterDisplay ?? '—' }}</span>
                }
              </td>
              <td>{{ slaDisplay(inc) }}</td>
              <td (click)="$event.stopPropagation()">
                @if (inc.claimedById && inc.claimedByEmail !== myEmail()) {
                  <span class="claim-badge claim-badge--other">🔒 {{ (inc.claimedByEmail ?? '').split('@')[0] }}</span>
                } @else if (inc.claimedByEmail === myEmail()) {
                  <button class="claim-btn claim-btn--release" (click)="release(inc)">Release</button>
                } @else {
                  <button class="claim-btn" (click)="claim(inc)">Claim</button>
                }
              </td>
              <td>{{ inc.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }

</div>
`,
  styles: [`
    .pa-page { padding:1.25rem 1.75rem; max-width:1200px; margin:0 auto; font-family:inherit; }
    .pa-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.1rem; }
    .pa-title { font-size:1.4rem; font-weight:700; color:#111827; margin:0 0 3px; }
    .pa-sub { font-size:0.8rem; color:#9ca3af; margin:0; }
    .refresh-btn { padding:6px 14px; font-size:0.78rem; font-weight:500; background:#fff; border:1px solid #d1d5db; border-radius:7px; cursor:pointer; color:#374151; }
    .refresh-btn:hover { background:#f9fafb; }

    .pa-empty { padding:3rem; text-align:center; color:#9ca3af; font-size:0.85rem;
      background:#fff; border:1px solid #e5e7eb; border-radius:10px; }

    .inc-table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    .inc-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
    .inc-table thead th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:600;
      color:#6b7280; border-bottom:1px solid #f3f4f6; background:#fafafa; }
    .inc-row { border-bottom:1px solid #f3f4f6; cursor:pointer; transition:background .12s; }
    .inc-row:hover { background:#f9fafb; }
    .inc-row--critical { background:#fff8f8; }
    .inc-row--critical:hover { background:#fff0f0; }
    .inc-row td { padding:0.7rem 1rem; vertical-align:middle; }
    .inc-no-cell { font-weight:600; color:#111827; display:flex; align-items:center; gap:0.3rem; }
    .sla-alert { background:#dc2626; color:#fff; font-size:0.6rem; font-weight:800;
      border-radius:50%; width:14px; height:14px; display:inline-flex; align-items:center;
      justify-content:center; flex-shrink:0; }

    .cat-tag { font-size:0.75rem; padding:2px 8px; background:#f3f4f6; border-radius:8px; color:#374151; }
    .sev-pill { font-size:0.72rem; font-weight:700; padding:2px 10px; border-radius:10px; }
    .sev-pill--critical { background:#fef2f2; color:#dc2626; }
    .sev-pill--high     { background:#fff7ed; color:#c2410c; }
    .sev-pill--medium   { background:#fefce8; color:#92400e; }
    .sev-pill--low      { background:#f0fdf4; color:#16a34a; }
    .stat-pill { font-size:0.72rem; font-weight:600; padding:2px 10px; border-radius:10px; }
    .stat-pill--open       { background:#eff6ff; color:#2563eb; }
    .stat-pill--inprogress { background:#fefce8; color:#92400e; }
    .stat-pill--closed     { background:#f0fdf4; color:#16a34a; }
    .stat-pill--pending    { background:#f5f3ff; color:#7c3aed; }

    .claim-badge { font-size:0.7rem; font-weight:600; padding:2px 8px; border-radius:8px;
      background:#fee2e2; color:#991b1b; }
    .claim-btn { font-size:0.72rem; font-weight:600; padding:3px 10px; border-radius:8px;
      border:1px solid #d1d5db; background:#fff; color:#374151; cursor:pointer; transition:all .12s; }
    .claim-btn:hover { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
    .claim-btn--release { border-color:#fca5a5; color:#b91c1c; }
    .claim-btn--release:hover { background:#fef2f2; }
    .conf-badge { font-size:0.7rem; font-weight:600; color:#7c3aed; }
    .reporter-text { font-size:0.75rem; color:#6b7280; }
  `]
})
export class ApproverQueueComponent implements OnInit {
  incidents = signal<IncidentSummary[]>([]);
  loading   = signal(true);
  myEmail   = signal<string>('');

  constructor(
    private router: Router,
    private incidentService: IncidentService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.myEmail.set(this.auth.currentEmail() ?? '');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.incidentService.getApproverQueue().subscribe({
      next: list => { this.incidents.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false)
    });
  }

  openDetail(inc: IncidentSummary): void {
    this.router.navigate(['/incidents', inc.incidentReference], { queryParams: { from: 'approver' } });
  }

  claim(inc: IncidentSummary): void {
    this.incidentService.claimIncident(inc.id).subscribe({
      next: () => this.load(),
      error: err => alert(err?.error?.error ?? 'Claim failed.')
    });
  }

  release(inc: IncidentSummary): void {
    this.incidentService.releaseIncident(inc.id).subscribe({
      next: () => this.load(),
      error: () => this.load()
    });
  }

  isCriticalOrBreached(inc: IncidentSummary): boolean {
    if (!inc.slaStartedAt || !inc.slaTargetMinutes) return false;
    const elapsed = (Date.now() - new Date(inc.slaStartedAt).getTime()) / 60_000;
    return elapsed / inc.slaTargetMinutes >= 0.8;
  }

  slaDisplay(inc: IncidentSummary): string {
    if (!inc.slaStartedAt || !inc.slaTargetMinutes) return '—';
    const elapsed = (Date.now() - new Date(inc.slaStartedAt).getTime()) / 60_000;
    const rem = inc.slaTargetMinutes - elapsed;
    if (rem <= 0) return 'BREACHED';
    const h = Math.floor(rem / 60);
    const m = Math.floor(rem % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  sevClass(v: number): string {
    return ['', 'sev-pill--critical', 'sev-pill--high', 'sev-pill--medium', 'sev-pill--low'][v] ?? 'sev-pill--low';
  }
  sevLabel(v: number): string {
    return ['', 'Critical', 'High', 'Medium', 'Low'][v] ?? 'Low';
  }
  statClass(s: string): string {
    const map: Record<string, string> = {
      'Submitted': 'stat-pill--open', 'Pending Reporter Input': 'stat-pill--pending',
      'In Progress': 'stat-pill--inprogress', 'Resolved': 'stat-pill--closed'
    };
    return map[s] ?? 'stat-pill--open';
  }
}
