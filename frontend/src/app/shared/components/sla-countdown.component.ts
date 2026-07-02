import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SLA countdown badge. Given the clock's start time and target budget (minutes),
 * it renders the remaining time, colour-coded by elapsed fraction:
 *   green  < 50%   ·   amber 50–80%   ·   red 80–100%   ·   "BREACHED" ≥ 100%
 *
 * Purely client-side (FS-14 lean slice) — ticks once a minute. Automatic
 * breach notifications are the concern of the deferred Hangfire slice (FS-14b).
 */
@Component({
  selector: 'app-sla-countdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (startedAt && targetMinutes) {
      <span [class]="'sla-badge sla-badge--' + stage()" [title]="stageTitle()">
        <span class="sla-dot"></span>
        {{ label() }}
      </span>
    } @else {
      <span class="sla-badge sla-badge--none">—</span>
    }
  `,
  styles: [`
    .sla-badge { display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; font-weight:600; padding:3px 9px; border-radius:12px; white-space:nowrap; }
    .sla-dot { width:6px; height:6px; border-radius:50%; background:currentColor; flex-shrink:0; }
    .sla-badge--ok       { background:#f0fdf4; color:#16a34a; }
    .sla-badge--warning  { background:#fffbeb; color:#d97706; }
    .sla-badge--critical { background:#fef2f2; color:#dc2626; }
    .sla-badge--breached { background:#dc2626; color:#fff; }
    .sla-badge--none     { background:#f3f4f6; color:#9ca3af; }
  `]
})
export class SlaCountdownComponent implements OnInit, OnDestroy {
  @Input() startedAt: string | null | undefined;
  @Input() targetMinutes: number | null | undefined;

  stage = signal<'ok' | 'warning' | 'critical' | 'breached' | 'none'>('none');
  label = signal('—');

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tick();
    // Re-evaluate every minute; countdown resolution of one minute is plenty for SLA windows.
    this.timer = setInterval(() => this.tick(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private tick(): void {
    if (!this.startedAt || !this.targetMinutes) {
      this.stage.set('none');
      this.label.set('—');
      return;
    }

    const started = new Date(this.startedAt).getTime();
    const elapsedMin = (Date.now() - started) / 60_000;
    const remainingMin = this.targetMinutes - elapsedMin;
    const fraction = elapsedMin / this.targetMinutes;

    if (fraction >= 1) {
      this.stage.set('breached');
      this.label.set('BREACHED ' + this.fmt(Math.abs(remainingMin)) + ' over');
    } else {
      this.stage.set(fraction >= 0.8 ? 'critical' : fraction >= 0.5 ? 'warning' : 'ok');
      this.label.set(this.fmt(remainingMin) + ' left');
    }
  }

  private fmt(minutes: number): string {
    const m = Math.max(0, Math.round(minutes));
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ${m % 60}m`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }

  stageTitle(): string {
    if (!this.targetMinutes) return '';
    return `SLA budget: ${this.fmt(this.targetMinutes)}`;
  }
}
