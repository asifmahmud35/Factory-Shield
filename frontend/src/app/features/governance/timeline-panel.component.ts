import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GovernanceService, TimelineEntry } from './governance.service';

@Component({
  selector: 'app-timeline-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="tl-wrap">
  <div class="tl-header">
    <span class="tl-title">Audit Timeline</span>
    <button class="tl-refresh" (click)="load()">↺</button>
  </div>

  @if (loading()) {
    <div class="tl-empty">Loading…</div>
  } @else if (entries().length === 0) {
    <div class="tl-empty">No events recorded yet.</div>
  } @else {
    <div class="tl-list">
      @for (e of entries(); track e.id) {
        <div class="tl-row">
          <div class="tl-dot" [class]="dotClass(e.eventType)"></div>
          <div class="tl-body">
            <div class="tl-top">
              <span class="tl-type" [class]="typeClass(e.eventType)">{{ e.eventType }}</span>
              @if (e.fromStatus || e.toStatus) {
                <span class="tl-states">
                  @if (e.fromStatus) { <span class="tl-state">{{ e.fromStatus }}</span> }
                  @if (e.toStatus) { <span class="tl-arrow">→</span><span class="tl-state tl-state--to">{{ e.toStatus }}</span> }
                </span>
              }
              <span class="tl-scope tl-scope--{{ e.visibilityScope.toLowerCase() }}">{{ e.visibilityScope }}</span>
            </div>
            @if (e.description) {
              <div class="tl-desc">{{ e.description }}</div>
            }
            <div class="tl-meta">
              @if (e.actorEmail) { <span>{{ e.actorEmail }}</span> }
              @if (e.actorRole) { <span class="tl-role">{{ e.actorRole }}</span> }
              <span class="tl-time">{{ e.createdAt | date:'yyyy-MM-dd HH:mm' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  }
</div>
`,
  styles: [`
    .tl-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    .tl-header { display:flex; align-items:center; justify-content:space-between;
      padding:0.7rem 1rem; border-bottom:1px solid #f3f4f6; background:#fafafa; }
    .tl-title { font-size:0.8rem; font-weight:700; color:#374151; }
    .tl-refresh { background:none; border:none; cursor:pointer; color:#6b7280; font-size:0.9rem; padding:0 4px; }
    .tl-empty { padding:1.5rem; text-align:center; color:#9ca3af; font-size:0.8rem; }
    .tl-list { padding:0.5rem 0; }
    .tl-row { display:flex; gap:0.6rem; padding:0.55rem 1rem; border-bottom:1px solid #f9fafb; }
    .tl-row:last-child { border-bottom:none; }
    .tl-dot { width:8px; height:8px; border-radius:50%; margin-top:5px; flex-shrink:0; background:#9ca3af; }
    .tl-dot--state    { background:#3b82f6; }
    .tl-dot--decision { background:#f59e0b; }
    .tl-dot--approval { background:#8b5cf6; }
    .tl-dot--claim    { background:#10b981; }
    .tl-dot--escalation { background:#ef4444; }
    .tl-body { flex:1; min-width:0; }
    .tl-top { display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:2px; }
    .tl-type { font-size:0.68rem; font-weight:700; padding:1px 6px; border-radius:6px;
      background:#f3f4f6; color:#374151; }
    .tl-type--STATE_CHANGE  { background:#eff6ff; color:#1d4ed8; }
    .tl-type--DECISION      { background:#fffbeb; color:#92400e; }
    .tl-type--APPROVAL      { background:#f5f3ff; color:#5b21b6; }
    .tl-type--CLAIM         { background:#ecfdf5; color:#065f46; }
    .tl-type--ESCALATION    { background:#fef2f2; color:#991b1b; }
    .tl-states { display:flex; align-items:center; gap:0.25rem; }
    .tl-state { font-size:0.68rem; background:#f3f4f6; padding:1px 5px; border-radius:4px; color:#6b7280; }
    .tl-state--to { background:#d1fae5; color:#065f46; }
    .tl-arrow { color:#9ca3af; font-size:0.7rem; }
    .tl-scope { font-size:0.62rem; font-weight:600; padding:1px 5px; border-radius:4px; margin-left:auto; }
    .tl-scope--public   { background:#ecfdf5; color:#065f46; }
    .tl-scope--internal { background:#eff6ff; color:#1e40af; }
    .tl-scope--restricted { background:#fef2f2; color:#991b1b; }
    .tl-desc { font-size:0.77rem; color:#374151; margin-bottom:2px; }
    .tl-meta { display:flex; gap:0.5rem; font-size:0.68rem; color:#9ca3af; }
    .tl-role { font-weight:600; color:#6b7280; }
    .tl-time { margin-left:auto; }
  `]
})
export class TimelinePanelComponent implements OnInit {
  @Input() incidentId!: string;

  entries = signal<TimelineEntry[]>([]);
  loading = signal(true);

  constructor(private governance: GovernanceService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.governance.getTimeline(this.incidentId).subscribe({
      next: data => { this.entries.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false)
    });
  }

  dotClass(type: string): string {
    const map: Record<string, string> = {
      STATE_CHANGE: 'tl-dot--state',
      DECISION: 'tl-dot--decision',
      APPROVAL: 'tl-dot--approval',
      CLAIM: 'tl-dot--claim',
      ESCALATION: 'tl-dot--escalation',
    };
    return map[type] ?? '';
  }

  typeClass(type: string): string {
    return `tl-type--${type}`;
  }
}
