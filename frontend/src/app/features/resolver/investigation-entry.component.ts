import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IncidentService, IncidentSummary } from '../incidents/incident.service';
import { RecentIncidentService } from '../../core/services/recent-incident.service';

/** Opens the investigation workspace for the best available assigned incident. */
@Component({
  selector: 'app-investigation-entry',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="entry-state">Opening investigation workspace…</div>
    } @else if (empty()) {
      <div class="entry-empty">
        <h1 class="entry-title">Investigation</h1>
        <p>No incidents are currently assigned to you for investigation.</p>
      </div>
    }
  `,
  styles: [`
    .entry-state, .entry-empty {
      padding: 2rem 1.75rem;
      color: #6b7280;
      font-size: 0.85rem;
    }
    .entry-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem;
    }
    .entry-empty p { margin: 0; }
  `],
})
export class InvestigationEntryComponent implements OnInit {
  private incidents = inject(IncidentService);
  private router = inject(Router);
  private recent = inject(RecentIncidentService);

  loading = signal(true);
  empty = signal(false);

  ngOnInit(): void {
    this.incidents.getAssignedIncidents().subscribe({
      next: list => this.openWorkspace(list),
      error: () => {
        this.loading.set(false);
        this.empty.set(true);
      },
    });
  }

  private openWorkspace(list: IncidentSummary[]): void {
    if (list.length === 0) {
      this.loading.set(false);
      this.empty.set(true);
      return;
    }

    const ref = this.recent.lastViewedRef();
    const target =
      (ref ? list.find(i => i.incidentReference === ref) : undefined) ?? list[0];

    if (target.incidentReference) {
      this.recent.setLastViewed(target.incidentReference);
    }

    this.router.navigate(
      ['/resolver/incidents', target.id, 'investigation'],
      { replaceUrl: true },
    );
  }
}
