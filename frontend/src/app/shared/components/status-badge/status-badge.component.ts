import { Component, Input } from '@angular/core';

const STATUS_COLORS: Record<string, string> = {
  'Submitted':   '#2563eb',   // vivid blue
  'In Progress': '#ea580c',   // orange
  'Resolved':    '#16a34a',   // green
  'Rejected':    '#dc2626',   // red
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [style.background]="color"
      style="display:inline-block;padding:0.15rem 0.55rem;border-radius:100px;
             color:#fff;font-size:0.65rem;font-weight:700;letter-spacing:0.04em;white-space:nowrap">
      {{ status }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status = '';

  get color(): string {
    return STATUS_COLORS[this.status] ?? '#6b7280';
  }
}
