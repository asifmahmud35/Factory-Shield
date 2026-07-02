import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IncidentService, IncidentSummary } from '../incident.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-incidents-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="all-inc-page">

      <!-- Header -->
      <div class="all-inc-hd">
        <div>
          <h1 class="all-inc-title">All Incidents</h1>
          <p class="all-inc-sub">{{ filtered().length }} incidents found</p>
        </div>
        <button class="btn-rep-inc" (click)="router.navigate(['/report'])">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Report Incident
        </button>
      </div>

      <!-- Toolbar -->
      <div class="all-inc-toolbar">
        <div class="inc-srch">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search by ID, category, department, reporter..."
            (input)="onSearch($event)">
        </div>
        <div class="toolbar-acts">
          <button class="tbar-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filters
          </button>
          <button class="tbar-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          <button class="tbar-btn tbar-btn--icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
          </button>
          <button class="tbar-btn tbar-btn--icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.99"/>
            </svg>
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="inc-state">Loading incidents…</div>
      } @else if (error()) {
        <div class="inc-state inc-state--error">
          {{ error() }}
          <button type="button" class="inc-retry-btn" (click)="load()">Retry</button>
        </div>
      } @else {
        <div class="inc-table-wrap">
          <table class="inc-table">
            <thead>
              <tr>
                <th style="width:38px"><input type="checkbox"></th>
                <th>INCIDENT NO</th>
                <th>DATE</th>
                <th>CATEGORY</th>
                <th>DEPARTMENT</th>
                <th>AREA</th>
                <th>REPORTED BY</th>
                <th>SEVERITY</th>
                <th>STATUS</th>
                <th>ASSIGNED TO</th>
                <th>DUE DATE</th>
                <th style="width:50px">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              @for (inc of filtered(); track inc.id) {
                <tr class="inc-row" (click)="navigateToDetail(inc)">
                  <td><input type="checkbox" (click)="$event.stopPropagation()"></td>
                  <td class="inc-no-cell">{{ inc.incidentReference }}</td>
                  <td class="inc-date-cell">{{ (inc.incidentDate ?? inc.createdAt) | date:'yyyy-MM-dd HH:mm' }}</td>
                  <td><span class="cat-tag">{{ inc.category }}</span></td>
                  <td>{{ inc.department ?? '—' }}</td>
                  <td>{{ inc.area ?? '—' }}</td>
                  <td>{{ inc.reportedBy ?? '—' }}</td>
                  <td><span [class]="'sev-pill ' + sevClass(inc.severity)">{{ sevLabel(inc.severity) }}</span></td>
                  <td><span [class]="'stat-pill ' + statClass(inc.displayStatus)">{{ inc.displayStatus }}</span></td>
                  <td>
                    <div class="asn-cell">
                      @if (inc.assignedToInitials) {
                        <div class="asn-av" [style.background]="inc.assignedToColor ?? '#6b7280'">
                          {{ inc.assignedToInitials }}
                        </div>
                      }
                      <span>{{ inc.assignedTo ?? '—' }}</span>
                    </div>
                  </td>
                  <td [class.due-overdue]="isOverdue(inc)">{{ inc.dueDate ?? '—' }}</td>
                  <td>
                    <button class="act-btn" (click)="$event.stopPropagation()">•••</button>
                  </td>
                </tr>
              }
              @if (filtered().length === 0) {
                <tr>
                  <td colspan="12" class="no-data-cell">
                    @if (searchQuery()) {
                      No incidents match your search.
                    } @else {
                      No incidents yet. <a class="inc-empty-link" (click)="router.navigate(['/report'])">Report an incident</a>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (incidents().length > 0) {
            <div class="inc-pag">
              <span class="pag-info">Showing {{ filtered().length }} of {{ incidents().length }} incidents</span>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .inc-state { padding:2rem 1.25rem; color:#6b7280; font-size:0.82rem; text-align:center; }
    .inc-state--error { color:#991b1b; background:#fef2f2; border:1px solid #fecaca; border-radius:10px; margin:0 0.5rem; }
    .inc-retry-btn { display:block; margin:0.75rem auto 0; padding:6px 14px; font-size:0.78rem;
      background:#fff; border:1px solid #d1d5db; border-radius:6px; cursor:pointer; }
    .inc-empty-link { color:#ef4444; cursor:pointer; text-decoration:underline; }
  `]
})
export class MyIncidentsListComponent implements OnInit {
  incidents = signal<IncidentSummary[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.incidents();
    return this.incidents().filter(i =>
      i.incidentReference.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      (i.department ?? '').toLowerCase().includes(q) ||
      (i.area ?? '').toLowerCase().includes(q) ||
      (i.reportedBy ?? '').toLowerCase().includes(q) ||
      (i.assignedTo ?? '').toLowerCase().includes(q)
    );
  });

  constructor(
    private incidentService: IncidentService,
    private auth: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    // Reporters only ever see their own submissions; every other role sees
    // the org-wide list — this page is titled "All Incidents", not "mine".
    const source = this.auth.currentRole() === 'REPORTER'
      ? this.incidentService.getMyIncidents()
      : this.incidentService.getAllIncidents();

    source.subscribe({
      next: list => {
        this.incidents.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.incidents.set([]);
        this.error.set('Failed to load incidents. Please try again.');
        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  navigateToDetail(inc: IncidentSummary): void {
    this.router.navigate(['/incidents', inc.incidentReference]);
  }

  sevClass(v: number): string {
    return ['', 'sev-pill--critical', 'sev-pill--high', 'sev-pill--medium', 'sev-pill--low'][v] ?? 'sev-pill--low';
  }

  sevLabel(v: number): string {
    return ['', 'Critical', 'High', 'Medium', 'Low'][v] ?? 'Low';
  }

  statClass(s: string): string {
    const map: Record<string, string> = {
      'Open': 'stat-pill--open',
      'In Progress': 'stat-pill--inprogress',
      'Investigation': 'stat-pill--investigation',
      'Closed': 'stat-pill--closed',
      'Root Cause': 'stat-pill--rootcause',
      'CAPA': 'stat-pill--capa',
      'Submitted': 'stat-pill--open',
      'Resolved': 'stat-pill--closed',
    };
    return map[s] ?? 'stat-pill--open';
  }

  isOverdue(inc: IncidentSummary): boolean {
    if (!inc.dueDate || inc.displayStatus === 'Closed') return false;
    return new Date(inc.dueDate) < new Date();
  }
}
