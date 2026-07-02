import { Component, Input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IncidentService, IncidentDetail, Resolver } from '../incidents/incident.service';

type ApproverMode = 'approve' | 'soft' | 'hard' | 'escalate' | 'reassign' | 'merge' | 'requestInfo';

@Component({
  selector: 'app-approver-actions-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="apr-panel">
      <div class="inc-det-section-title">APPROVER DECISION</div>

      @if (error()) {
        <div class="apr-msg apr-msg--err">{{ error() }}</div>
      }
      @if (success()) {
        <div class="apr-msg apr-msg--ok">{{ success() }}</div>
      }

      <div class="apr-modes">
        <button type="button" class="apr-mode-btn" [class.is-active]="mode() === 'approve'" (click)="toggleMode('approve')">Approve</button>
        <button type="button" class="apr-mode-btn" [class.is-active]="mode() === 'soft'" (click)="toggleMode('soft')">Soft Reject</button>
        <button type="button" class="apr-mode-btn" [class.is-active]="mode() === 'hard'" (click)="toggleMode('hard')">Hard Reject</button>
        <button type="button" class="apr-mode-btn apr-mode-btn--warn" [class.is-active]="mode() === 'escalate'" (click)="toggleMode('escalate')">Escalate</button>
        <button type="button" class="apr-mode-btn apr-mode-btn--indigo" [class.is-active]="mode() === 'reassign'" (click)="toggleMode('reassign')">Reassign</button>
        <button type="button" class="apr-mode-btn apr-mode-btn--purple" [class.is-active]="mode() === 'merge'" (click)="toggleMode('merge')">Merge</button>
        <button type="button" class="apr-mode-btn apr-mode-btn--cyan" [class.is-active]="mode() === 'requestInfo'" (click)="toggleMode('requestInfo')">Request Info</button>
      </div>

      @if (mode() === 'approve') {
        <label class="apr-label">Assign to resolver</label>
        <select [(ngModel)]="selectedResolverId" class="apr-input">
          <option value="">Select a resolver…</option>
          @for (r of resolvers; track r.id) {
            <option [value]="r.id">{{ r.name }} ({{ r.email }})</option>
          }
        </select>
        <button type="button" class="apr-submit" [disabled]="!selectedResolverId || busy()" (click)="approve()">
          {{ busy() ? 'Approving…' : 'Confirm Approve' }}
        </button>
      }

      @if (mode() === 'soft' || mode() === 'hard') {
        <label class="apr-label">Reason ({{ mode() === 'hard' ? 'hard' : 'soft' }} reject)</label>
        <textarea [(ngModel)]="rejectReason" rows="3" class="apr-input" placeholder="Min 10 characters…"></textarea>
        <button type="button" class="apr-submit" [disabled]="rejectReason.length < 10 || busy()" (click)="reject()">
          Confirm Reject
        </button>
      }

      @if (mode() === 'escalate') {
        <label class="apr-label">Escalation reason</label>
        <textarea [(ngModel)]="escalateReason" rows="3" class="apr-input" placeholder="Min 10 characters…"></textarea>
        <button type="button" class="apr-submit apr-submit--warn" [disabled]="escalateReason.length < 10 || busy()" (click)="escalate()">
          Confirm Escalation
        </button>
      }

      @if (mode() === 'reassign') {
        <label class="apr-label">New category</label>
        <input [(ngModel)]="reassignCategory" class="apr-input" placeholder="e.g. Electrical">
        <label class="apr-label">New severity</label>
        <select [(ngModel)]="reassignSeverity" class="apr-input">
          <option [ngValue]="1">Critical</option>
          <option [ngValue]="2">High</option>
          <option [ngValue]="3">Medium</option>
          <option [ngValue]="4">Low</option>
        </select>
        <label class="apr-label">Reason</label>
        <textarea [(ngModel)]="reassignReason" rows="3" class="apr-input" placeholder="Min 10 characters…"></textarea>
        <button type="button" class="apr-submit apr-submit--indigo"
          [disabled]="!reassignCategory.trim() || reassignReason.length < 10 || busy()" (click)="reassign()">
          Confirm Reassign
        </button>
      }

      @if (mode() === 'merge') {
        <label class="apr-label">Primary incident reference</label>
        <input [(ngModel)]="mergeTarget" class="apr-input" placeholder="e.g. INC-2026-0001">
        <label class="apr-label">Merge reason</label>
        <textarea [(ngModel)]="mergeReason" rows="2" class="apr-input"></textarea>
        <button type="button" class="apr-submit apr-submit--purple" [disabled]="!mergeTarget.trim() || busy()" (click)="merge()">
          Confirm Merge
        </button>
      }

      @if (mode() === 'requestInfo') {
        <label class="apr-label">Question for reporter</label>
        <textarea [(ngModel)]="infoQuestion" rows="4" class="apr-input" placeholder="Min 10 characters…"></textarea>
        <button type="button" class="apr-submit apr-submit--cyan" [disabled]="infoQuestion.length < 10 || busy()" (click)="requestInfo()">
          Send Request
        </button>
      }
    </div>
  `,
  styles: [`
    .apr-panel { margin-top: 0.5rem; }
    .apr-modes { display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.85rem; }
    .apr-mode-btn { padding:5px 10px; font-size:0.72rem; font-weight:600; border:1px solid #e5e7eb;
      border-radius:6px; background:#fff; cursor:pointer; color:#374151; }
    .apr-mode-btn.is-active { border-color:#ef4444; color:#ef4444; background:#fef2f2; }
    .apr-mode-btn--warn.is-active { border-color:#f59e0b; color:#92400e; background:#fffbeb; }
    .apr-mode-btn--indigo.is-active { border-color:#6366f1; color:#4f46e5; background:#eef2ff; }
    .apr-mode-btn--purple.is-active { border-color:#8b5cf6; color:#7c3aed; background:#f5f3ff; }
    .apr-mode-btn--cyan.is-active { border-color:#0891b2; color:#0e7490; background:#ecfeff; }
    .apr-label { display:block; font-size:0.68rem; font-weight:700; color:#9ca3af; margin:0.5rem 0 0.25rem; text-transform:uppercase; }
    .apr-input { width:100%; padding:0.45rem 0.55rem; font-size:0.82rem; border:1px solid #e5e7eb; border-radius:7px; margin-bottom:0.35rem; }
    .apr-submit { margin-top:0.5rem; padding:6px 14px; font-size:0.78rem; font-weight:600; border:none; border-radius:7px;
      background:#ef4444; color:#fff; cursor:pointer; }
    .apr-submit:disabled { opacity:0.45; cursor:not-allowed; }
    .apr-submit--warn { background:#f59e0b; }
    .apr-submit--indigo { background:#6366f1; }
    .apr-submit--purple { background:#8b5cf6; }
    .apr-submit--cyan { background:#0891b2; }
    .apr-msg { font-size:0.78rem; margin-bottom:0.6rem; padding:0.45rem 0.6rem; border-radius:6px; }
    .apr-msg--err { background:#fef2f2; color:#991b1b; }
    .apr-msg--ok { background:#f0fdf4; color:#166534; }
  `],
})
export class ApproverActionsPanelComponent implements OnInit {
  @Input({ required: true }) incident!: IncidentDetail;
  readonly refreshed = output<void>();

  mode = signal<ApproverMode | null>(null);
  busy = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  resolvers: Resolver[] = [];
  selectedResolverId = '';
  rejectReason = '';
  escalateReason = '';
  reassignCategory = '';
  reassignSeverity = 4;
  reassignReason = '';
  mergeTarget = '';
  mergeReason = '';
  infoQuestion = '';

  constructor(
    private incidents: IncidentService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.incidents.getResolvers().subscribe({
      next: list => this.resolvers = list,
      error: () => this.resolvers = [],
    });
  }

  toggleMode(m: ApproverMode): void {
    this.mode.set(this.mode() === m ? null : m);
    this.error.set(null);
    this.success.set(null);
  }

  approve(): void {
    if (!this.selectedResolverId) return;
    this.busy.set(true);
    this.error.set(null);
    this.incidents.approveIncident(this.incident.id, this.selectedResolverId).subscribe({
      next: () => { this.busy.set(false); this.refreshed.emit(); this.success.set('Incident approved.'); },
      error: err => { this.busy.set(false); this.error.set(this.extractError(err)); },
    });
  }

  reject(): void {
    const m = this.mode();
    if ((m !== 'soft' && m !== 'hard') || this.rejectReason.length < 10) return;
    this.busy.set(true);
    this.incidents.rejectIncident(this.incident.id, m === 'hard' ? 'Hard' : 'Soft', this.rejectReason).subscribe({
      next: () => { this.busy.set(false); this.refreshed.emit(); this.success.set('Incident rejected.'); },
      error: err => { this.busy.set(false); this.error.set(this.extractError(err)); },
    });
  }

  escalate(): void {
    if (this.escalateReason.length < 10) return;
    this.busy.set(true);
    this.incidents.escalateIncident(this.incident.id, this.escalateReason).subscribe({
      next: () => {
        this.busy.set(false);
        this.refreshed.emit();
        this.success.set('Incident escalated.');
        this.escalateReason = '';
        this.mode.set(null);
      },
      error: err => { this.busy.set(false); this.error.set(this.extractError(err)); },
    });
  }

  reassign(): void {
    if (!this.reassignCategory.trim() || this.reassignReason.length < 10) return;
    this.busy.set(true);
    this.incidents.reassignIncident(this.incident.id, this.reassignCategory, this.reassignSeverity, this.reassignReason).subscribe({
      next: () => {
        this.busy.set(false);
        this.refreshed.emit();
        this.success.set('Incident reassigned.');
        this.mode.set(null);
      },
      error: err => { this.busy.set(false); this.error.set(this.extractError(err)); },
    });
  }

  merge(): void {
    const ref = this.mergeTarget.trim();
    if (!ref) return;
    this.busy.set(true);
    this.incidents.getIncident(ref).subscribe({
      next: primary => {
        this.incidents.mergeIncident(this.incident.id, primary.id, this.mergeReason || 'Duplicate').subscribe({
          next: () => this.router.navigate(['/approver/queue']),
          error: err => { this.busy.set(false); this.error.set(this.extractError(err)); },
        });
      },
      error: () => { this.busy.set(false); this.error.set(`Incident "${ref}" not found.`); },
    });
  }

  requestInfo(): void {
    if (this.infoQuestion.length < 10) return;
    this.busy.set(true);
    this.incidents.requestInfo(this.incident.id, this.infoQuestion).subscribe({
      next: () => {
        this.busy.set(false);
        this.refreshed.emit();
        this.success.set('Info request sent. SLA paused until reporter responds.');
        this.infoQuestion = '';
        this.mode.set(null);
      },
      error: err => { this.busy.set(false); this.error.set(this.extractError(err)); },
    });
  }

  private extractError(err: { error?: { error?: string; errors?: Record<string, string[]> } }): string {
    const errors = err?.error?.errors;
    if (errors) {
      const firstKey = Object.keys(errors)[0];
      return errors[firstKey]?.[0] ?? 'Request failed.';
    }
    return err?.error?.error ?? 'Request failed.';
  }
}
