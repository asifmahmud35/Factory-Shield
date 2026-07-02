import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IncidentService, IncidentSummary } from '../incidents/incident.service';
import { SlaCountdownComponent } from '../../shared/components/sla-countdown.component';
import { RecentIncidentService } from '../../core/services/recent-incident.service';

export type ResolverQueueMode = 'investigation' | 'rca' | 'capa';

const MODE_CONFIG: Record<ResolverQueueMode, { title: string; subtitle: string; segment: string }> = {
  investigation: {
    title: 'Investigation',
    subtitle: 'Select an assigned incident to open the investigation workspace',
    segment: 'investigation',
  },
  rca: {
    title: 'Root Cause Analysis',
    subtitle: 'Select an assigned incident to perform root cause analysis',
    segment: 'rca',
  },
  capa: {
    title: 'Corrective Actions',
    subtitle: 'Select an assigned incident to manage corrective actions',
    segment: 'capa',
  },
};

@Component({
  selector: 'app-assigned-dashboard',
  standalone: true,
  imports: [CommonModule, SlaCountdownComponent],
  template: `
    <div class="all-inc-page">

      <div class="all-inc-hd">
        <div>
          <h1 class="all-inc-title">{{ pageTitle() }}</h1>
          <p class="all-inc-sub">{{ pageSubtitle() }}</p>
        </div>
      </div>

      @if (loading()) {
        <div style="padding:2rem 1.25rem;color:#6b7280;font-size:0.82rem">Loading assigned incidents…</div>
      } @else {
        <div class="inc-table-wrap">
          <table class="inc-table">
            <thead>
              <tr>
                <th>INCIDENT NO</th>
                <th>CATEGORY</th>
                <th>SEVERITY</th>
                <th>STATUS</th>
                <th>SLA</th>
                <th>CREATED</th>
              </tr>
            </thead>
            <tbody>
              @for (inc of incidents(); track inc.id) {
                <tr class="inc-row" (click)="openWorkspace(inc.id)">
                  <td class="inc-no-cell">{{ inc.incidentReference }}</td>
                  <td><span class="cat-tag">{{ inc.category }}</span></td>
                  <td><span [class]="'sev-pill ' + sevClass(inc.severity)">{{ sevLabel(inc.severity) }}</span></td>
                  <td><span [class]="'stat-pill ' + statClass(inc.displayStatus)">{{ inc.displayStatus }}</span></td>
                  <td>
                    <app-sla-countdown [startedAt]="inc.slaStartedAt" [targetMinutes]="inc.slaTargetMinutes"></app-sla-countdown>
                  </td>
                  <td>{{ inc.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                </tr>
              }
              @if (incidents().length === 0) {
                <tr>
                  <td colspan="6" class="no-data-cell">No incidents currently assigned to you.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `
})
export class AssignedDashboardComponent implements OnInit {
  private incidentService = inject(IncidentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private recent = inject(RecentIncidentService);

  incidents = signal<IncidentSummary[]>([]);
  loading = signal(true);
  mode = signal<ResolverQueueMode>('investigation');
  pageTitle = signal('Investigation');
  pageSubtitle = signal('');

  ngOnInit(): void {
    this.route.data.subscribe(data => this.applyMode(data['mode'] as ResolverQueueMode));
    this.loadIncidents();
  }

  private applyMode(mode: ResolverQueueMode | undefined): void {
    const resolved = mode ?? 'investigation';
    const cfg = MODE_CONFIG[resolved] ?? MODE_CONFIG.investigation;
    this.mode.set(resolved);
    this.pageTitle.set(cfg.title);
    this.pageSubtitle.set(cfg.subtitle);
  }

  private loadIncidents(): void {
    this.loading.set(true);
    this.incidentService.getAssignedIncidents().subscribe({
      next: list => {
        this.incidents.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.incidents.set([]);
        this.loading.set(false);
      },
    });
  }

  openWorkspace(incidentId: string): void {
    const inc = this.incidents().find(i => i.id === incidentId);
    if (inc?.incidentReference) {
      this.recent.setLastViewed(inc.incidentReference);
    }
    const segment = MODE_CONFIG[this.mode()].segment;
    this.router.navigate(['/resolver/incidents', incidentId, segment]);
  }

  sevClass(v: number): string {
    return ['', 'sev-pill--critical', 'sev-pill--high', 'sev-pill--medium', 'sev-pill--low'][v] ?? 'sev-pill--low';
  }

  sevLabel(v: number): string {
    return ['', 'Critical', 'High', 'Medium', 'Low'][v] ?? 'Low';
  }

  statClass(s: string): string {
    const map: Record<string, string> = {
      'Submitted': 'stat-pill--open',
      'In Progress': 'stat-pill--inprogress',
      'Resolved': 'stat-pill--closed',
      'Rejected': 'stat-pill--capa',
    };
    return map[s] ?? 'stat-pill--open';
  }
}
