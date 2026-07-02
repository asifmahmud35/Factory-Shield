import { Component, Input, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CapaService, CorrectiveAction } from './capa.service';

@Component({
  selector: 'app-capa-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ws-card">
      <div class="ws-card-hd">
        Corrective Actions
        <button class="add-capa-btn" (click)="toggleForm()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Action
        </button>
      </div>

      <!-- Add form -->
      @if (showForm()) {
        <div class="capa-form">
          <div class="capa-form-row">
            <div class="ws-field">
              <label>Title *</label>
              <input type="text" [(ngModel)]="form.title" placeholder="Action title…">
            </div>
            <div class="ws-field">
              <label>Priority</label>
              <select [(ngModel)]="form.priority">
                <option [value]="1">Critical</option>
                <option [value]="2">High</option>
                <option [value]="3">Medium</option>
                <option [value]="4">Low</option>
              </select>
            </div>
          </div>
          <div class="capa-form-row">
            <div class="ws-field">
              <label>Owner</label>
              <input type="text" [(ngModel)]="form.owner" placeholder="Responsible person…">
            </div>
            <div class="ws-field">
              <label>Due Date</label>
              <input type="date" [(ngModel)]="form.dueDate">
            </div>
          </div>
          <div class="ws-field">
            <label>Description</label>
            <textarea rows="2" [(ngModel)]="form.description" placeholder="Optional details…"></textarea>
          </div>
          <div class="capa-form-actions">
            <button class="capa-cancel-btn" (click)="cancelForm()">Cancel</button>
            <button class="capa-save-btn" [disabled]="!form.title.trim()" (click)="submitForm()">
              Add Action
            </button>
          </div>
        </div>
      }

      <!-- Actions list -->
      @if (loading()) {
        <p class="capa-dim">Loading…</p>
      } @else {
        <div class="capa-list">
          @for (action of actions(); track action.id) {
            <div class="capa-item">
              <div class="capa-item-hd">
                <span [class]="'prio-dot prio-dot--' + prioCss(action.priority)"></span>
                <span class="capa-title">{{ action.title }}</span>
                <span [class]="'capa-status-pill ' + statusCss(action.status)">{{ action.status }}</span>
                @if (isOverdue(action)) {
                  <span class="overdue-tag">Overdue</span>
                }
              </div>

              @if (action.owner || action.dueDate) {
                <div class="capa-meta">
                  @if (action.owner) { <span>👤 {{ action.owner }}</span> }
                  @if (action.dueDate) { <span>📅 {{ action.dueDate | date:'yyyy-MM-dd' }}</span> }
                </div>
              }

              <!-- Progress bar -->
              <div class="progress-row">
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="action.completionPercentage"></div>
                </div>
                <span class="progress-pct">{{ action.completionPercentage }}%</span>
              </div>

              <!-- Inline update controls -->
              <div class="capa-controls">
                <input type="range" min="0" max="100" step="10"
                  [value]="action.completionPercentage"
                  (change)="updateProgress(action, +$any($event.target).value)">
                <select [value]="action.status"
                  (change)="updateStatus(action, $any($event.target).value)">
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Verified">Verified</option>
                </select>
              </div>
            </div>
          }
          @if (actions().length === 0 && !showForm()) {
            <p class="capa-empty">No corrective actions yet. Add one to get started.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ws-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:1.25rem; }
    .ws-card-hd { font-size:0.85rem; font-weight:600; color:#111827; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; }
    .add-capa-btn { display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:500; color:#6366f1; background:none; border:1px solid #e0e7ff; border-radius:6px; padding:4px 10px; cursor:pointer; }
    .add-capa-btn:hover { background:#eef2ff; }

    /* Form */
    .capa-form { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:1rem; margin-bottom:1rem; }
    .capa-form-row { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
    .ws-field { margin-bottom:0.75rem; }
    .ws-field label { display:block; font-size:0.7rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px; }
    .ws-field input, .ws-field select { width:100%; border:1px solid #e5e7eb; border-radius:6px; padding:6px 10px; font-size:0.82rem; box-sizing:border-box; background:#fff; }
    .ws-field textarea { width:100%; border:1px solid #e5e7eb; border-radius:6px; padding:6px 10px; font-size:0.82rem; box-sizing:border-box; resize:vertical; }
    .capa-form-actions { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:0.25rem; }
    .capa-cancel-btn { background:none; border:1px solid #e5e7eb; border-radius:6px; padding:6px 12px; font-size:0.78rem; cursor:pointer; color:#6b7280; }
    .capa-save-btn { background:#6366f1; color:#fff; border:none; border-radius:6px; padding:6px 14px; font-size:0.78rem; cursor:pointer; font-weight:500; }
    .capa-save-btn:disabled { opacity:.5; cursor:not-allowed; }

    /* List */
    .capa-list { display:flex; flex-direction:column; gap:0.75rem; }
    .capa-item { border:1px solid #f3f4f6; border-radius:8px; padding:0.85rem; }
    .capa-item-hd { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem; flex-wrap:wrap; }
    .prio-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .prio-dot--critical { background:#dc2626; }
    .prio-dot--high { background:#f97316; }
    .prio-dot--medium { background:#eab308; }
    .prio-dot--low { background:#22c55e; }
    .capa-title { font-size:0.83rem; font-weight:500; color:#111827; flex:1; }
    .capa-status-pill { font-size:0.68rem; font-weight:600; padding:2px 7px; border-radius:10px; }
    .status-open { background:#f3f4f6; color:#6b7280; }
    .status-inprogress { background:#eff6ff; color:#2563eb; }
    .status-completed { background:#f0fdf4; color:#16a34a; }
    .status-verified { background:#faf5ff; color:#7c3aed; }
    .overdue-tag { font-size:0.68rem; font-weight:600; background:#fef2f2; color:#dc2626; padding:2px 7px; border-radius:10px; }
    .capa-meta { display:flex; gap:0.75rem; font-size:0.73rem; color:#9ca3af; margin-bottom:0.4rem; }
    .progress-row { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem; }
    .progress-track { flex:1; height:5px; background:#f3f4f6; border-radius:3px; overflow:hidden; }
    .progress-fill { height:100%; background:#6366f1; border-radius:3px; transition:width .3s; }
    .progress-pct { font-size:0.72rem; color:#6b7280; width:30px; text-align:right; }
    .capa-controls { display:flex; gap:0.5rem; align-items:center; }
    .capa-controls input[type=range] { flex:1; accent-color:#6366f1; }
    .capa-controls select { font-size:0.75rem; border:1px solid #e5e7eb; border-radius:5px; padding:3px 6px; }
    .capa-empty, .capa-dim { font-size:0.78rem; color:#9ca3af; text-align:center; padding:1rem 0; margin:0; }
  `]
})
export class CapaTrackerComponent implements OnInit {
  @Input() incidentId = '';
  @Output() actionsCountChanged = new EventEmitter<number>();

  actions = signal<CorrectiveAction[]>([]);
  loading = signal(true);
  showForm = signal(false);

  form = { title: '', description: '', owner: '', dueDate: '', priority: 3 };

  constructor(private capaService: CapaService) {}

  ngOnInit(): void {
    this.loadActions();
  }

  private loadActions(): void {
    this.capaService.getActions(this.incidentId).subscribe({
      next: list => {
        this.actions.set(list);
        this.loading.set(false);
        this.actionsCountChanged.emit(list.length);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleForm(): void { this.showForm.set(!this.showForm()); }

  cancelForm(): void {
    this.showForm.set(false);
    this.form = { title: '', description: '', owner: '', dueDate: '', priority: 3 };
  }

  submitForm(): void {
    if (!this.form.title.trim()) return;
    this.capaService.createAction(this.incidentId, {
      title: this.form.title,
      description: this.form.description || null,
      owner: this.form.owner || null,
      dueDate: this.form.dueDate ? new Date(this.form.dueDate).toISOString() : null,
      priority: this.form.priority
    }).subscribe({
      next: () => { this.cancelForm(); this.loadActions(); }
    });
  }

  updateProgress(action: CorrectiveAction, pct: number): void {
    this.capaService.updateAction(action.id, { completionPercentage: pct }).subscribe({
      next: () => this.loadActions()
    });
  }

  updateStatus(action: CorrectiveAction, status: string): void {
    this.capaService.updateAction(action.id, { status }).subscribe({
      next: () => this.loadActions()
    });
  }

  prioCss(p: number): string {
    return ['', 'critical', 'high', 'medium', 'low'][p] ?? 'medium';
  }

  statusCss(s: string): string {
    const map: Record<string, string> = {
      'Open': 'capa-status-pill status-open',
      'InProgress': 'capa-status-pill status-inprogress',
      'Completed': 'capa-status-pill status-completed',
      'Verified': 'capa-status-pill status-verified'
    };
    return map[s] ?? 'capa-status-pill status-open';
  }

  isOverdue(action: CorrectiveAction): boolean {
    return !!action.dueDate &&
      new Date(action.dueDate) < new Date() &&
      action.status !== 'Completed' &&
      action.status !== 'Verified';
  }
}
