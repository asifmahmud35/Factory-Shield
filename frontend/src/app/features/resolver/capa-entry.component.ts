import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IncidentService } from '../incidents/incident.service';
import { RecentIncidentService } from '../../core/services/recent-incident.service';

@Component({
  selector: 'app-capa-entry',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="entry-state">Opening corrective actions…</div>
    } @else if (empty()) {
      <div class="entry-empty">
        <h1 class="entry-title">Corrective Actions</h1>
        <p>No incidents are currently assigned to you for CAPA.</p>
      </div>
    }
  `,
  styles: [`
    .entry-state, .entry-empty { padding: 2rem 1.75rem; color: #6b7280; font-size: 0.85rem; }
    .entry-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem; }
    .entry-empty p { margin: 0; }
  `],
})
export class CapaEntryComponent implements OnInit {
  private incidents = inject(IncidentService);
  private router = inject(Router);
  private recent = inject(RecentIncidentService);

  loading = signal(true);
  empty = signal(false);

  ngOnInit(): void {
    this.incidents.getAssignedIncidents().subscribe({
      next: list => {
        if (!list.length) { this.loading.set(false); this.empty.set(true); return; }
        const ref = this.recent.lastViewedRef();
        const target = (ref ? list.find(i => i.incidentReference === ref) : undefined) ?? list[0];
        if (target.incidentReference) this.recent.setLastViewed(target.incidentReference);
        this.router.navigate(['/resolver/incidents', target.id, 'capa'], { replaceUrl: true });
      },
      error: () => { this.loading.set(false); this.empty.set(true); },
    });
  }
}
