import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CapaService, CorrectiveAction } from '../capa.service';
import { IncidentService, IncidentAttachment } from '../../incidents/incident.service';
import { RecentIncidentService } from '../../../core/services/recent-incident.service';

export interface CaAction {
  id: string;
  ref: string;
  priority: 'Urgent' | 'High' | 'Normal';
  status: 'In Progress' | 'Open' | 'Completed' | 'Verified';
  title: string;
  team: string;
  dueDate: string;
  completionPct: number;
  verificationMethod: string;
  expanded: boolean;
}

const PRIORITY_TO_API: Record<CaAction['priority'], number> = {
  Urgent: 1,
  High: 2,
  Normal: 3,
};

function priorityLabel(p: number): CaAction['priority'] {
  if (p <= 1) return 'Urgent';
  if (p === 2) return 'High';
  return 'Normal';
}

function statusDisplay(status: string): CaAction['status'] {
  if (status === 'InProgress') return 'In Progress';
  if (status === 'Open') return 'Open';
  if (status === 'Completed') return 'Completed';
  if (status === 'Verified') return 'Verified';
  return 'Open';
}

function formatDueDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `Due ${d.toISOString().slice(0, 10)}`;
}

function isGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

@Component({
  selector: 'app-corrective-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="ca-page">

  @if (toast()) {
    <div [class]="'ca-toast ca-toast--' + toast()!.type">{{ toast()!.msg }}</div>
  }

  <!-- ── Page Header ──────────────────────────────────────────────── -->
  <div class="ca-hd">
    <div>
      <h1 class="ca-title">Corrective Actions (CAPA)</h1>
      <div class="ca-sub">{{ incidentRef }} — {{ actions().length }} actions · {{ overallPct() }}% complete</div>
    </div>
    <div class="ca-hd-right">
      <button type="button" class="btn-ai" (click)="showToast('err', 'AI suggestions are not available yet.')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2
                   M5.6 18.4l1.4-1.4m10-10 1.4-1.4"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        AI Suggestions
      </button>
      <button type="button" class="btn-add" (click)="showAddForm.set(true)" [disabled]="!incidentId || loading()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Action
      </button>
    </div>
  </div>

  @if (loading()) {
    <div class="ca-state">Loading corrective actions…</div>
  } @else if (error()) {
    <div class="ca-state ca-state--err">{{ error() }}</div>
  } @else {

  <!-- ── Overall CAPA Progress card ─────────────────────────────── -->
  <div class="progress-card">
    <div class="progress-card-hd">
      <span class="progress-card-title">Overall CAPA Progress</span>
      <span class="progress-card-pct">{{ overallPct() }}%</span>
    </div>
    <div class="progress-bar-track">
      <div class="progress-bar-fill" [style.width.%]="overallPct()"></div>
    </div>
    <div class="progress-stats">
      <div class="stat-box">
        <div class="stat-num">{{ actions().length }}</div>
        <div class="stat-label">Total Actions</div>
      </div>
      <div class="stat-box stat-box--purple">
        <div class="stat-num">{{ countByStatus('In Progress') }}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-box stat-box--blue">
        <div class="stat-num">{{ countByStatus('Open') }}</div>
        <div class="stat-label">Open</div>
      </div>
      <div class="stat-box stat-box--green">
        <div class="stat-num">{{ countByStatus('Completed') + countByStatus('Verified') }}</div>
        <div class="stat-label">Completed</div>
      </div>
    </div>
  </div>

  <!-- ── Add Action Form ─────────────────────────────────────────── -->
  @if (showAddForm()) {
    <div class="add-form-card">
      <div class="add-form-title">New Corrective Action</div>
      <div class="form-row-2">
        <div class="ff">
          <label>Title *</label>
          <input type="text" [(ngModel)]="newAction.title" placeholder="Action title…">
        </div>
        <div class="ff">
          <label>Priority</label>
          <select [(ngModel)]="newAction.priority">
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>
      <div class="form-row-2">
        <div class="ff">
          <label>Team / Owner</label>
          <input type="text" [(ngModel)]="newAction.team" placeholder="Responsible team…">
        </div>
        <div class="ff">
          <label>Due Date</label>
          <input type="date" [(ngModel)]="newAction.dueDate">
        </div>
      </div>
      <div class="ff">
        <label>Description</label>
        <textarea rows="2" [(ngModel)]="newAction.description" placeholder="Optional details…"></textarea>
      </div>
      <div class="add-form-footer">
        <button type="button" class="btn-cancel" (click)="showAddForm.set(false)">Cancel</button>
        <button type="button" class="btn-save" [disabled]="!newAction.title.trim() || saving()"
          (click)="addAction()">
          Add Action
        </button>
      </div>
    </div>
  }

  <!-- ── Action List ─────────────────────────────────────────────── -->
  <div class="action-list">
    @if (actions().length === 0) {
      <div class="ca-state">No corrective actions yet. Add one to get started.</div>
    }
    @for (action of actions(); track action.id) {
      <div class="action-card">

        <div class="ac-row" (click)="toggle(action)">
          <div [class]="'ac-icon ' + statusIconClass(action.status)">
            @if (action.status === 'In Progress') {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            } @else if (action.status === 'Completed' || action.status === 'Verified') {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            } @else {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
            }
          </div>

          <div class="ac-body">
            <div class="ac-tags">
              <span class="ac-ref">{{ action.ref }}</span>
              <span [class]="'badge-prio ' + prioCls(action.priority)">{{ action.priority }}</span>
              <span [class]="'badge-status ' + statusCls(action.status)">{{ action.status }}</span>
            </div>
            <div class="ac-title">{{ action.title }}</div>
            <div class="ac-meta">{{ action.team }} · {{ action.dueDate }}</div>
          </div>

          <div class="ac-right">
            @if (action.completionPct > 0) {
              <div class="ac-pct-wrap">
                <div class="ac-mini-bar">
                  <div class="ac-mini-fill" [style.width.%]="action.completionPct"></div>
                </div>
                <span class="ac-pct-lbl">{{ action.completionPct }}%</span>
              </div>
            }
            <svg [class]="'chevron ' + (action.expanded ? 'chevron--up' : '')"
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        @if (action.expanded) {
          <div class="ac-detail">
            <div class="ac-detail-row">
              <div class="ac-detail-field">
                <label>Verified By</label>
                <input type="text" [(ngModel)]="action.verificationMethod"
                  placeholder="Who will verify this action?"
                  (blur)="saveVerifiedBy(action)"
                  (click)="$event.stopPropagation()">
              </div>
              <div class="ac-detail-field">
                <label>Completion %</label>
                <input type="range" min="0" max="100" step="10"
                  [(ngModel)]="action.completionPct"
                  class="pct-slider"
                  (change)="saveCompletion(action)"
                  (click)="$event.stopPropagation()">
              </div>
            </div>
            @if (evidenceFor(action.id).length > 0) {
              <div class="ac-evidence-list">
                @for (ev of evidenceFor(action.id); track ev.id) {
                  <div class="ac-evidence-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span class="ac-evidence-note">{{ ev.evidenceNote ?? 'Evidence file' }}</span>
                    <span class="ac-evidence-meta">{{ ev.uploaderName ?? 'Unknown' }} · {{ ev.uploadedAt | date:'MMM d, HH:mm' }}</span>
                  </div>
                }
              </div>
            }
            <div class="ac-detail-actions">
              <button type="button" class="btn-upload" (click)="pickEvidence(action); $event.stopPropagation()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Evidence
              </button>
              @if (action.status !== 'Completed' && action.status !== 'Verified') {
                <button type="button" class="btn-complete"
                  (click)="markComplete(action); $event.stopPropagation()"
                  [disabled]="saving()">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Mark Complete
                </button>
              }
            </div>
          </div>
        }

      </div>
    }
  </div>

  }

  <input #evidenceInput type="file" class="hidden-file" (change)="onEvidenceSelected($event)">
</div>
`,
  styles: [`
    .ca-page { padding:1.25rem 1.75rem; max-width:1100px; margin:0 auto; font-family:inherit; }
    .ca-toast { padding:0.55rem 1rem; border-radius:8px; font-size:0.8rem; margin-bottom:0.85rem; }
    .ca-toast--ok  { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }
    .ca-toast--err { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
    .ca-state { padding:2rem; text-align:center; font-size:0.85rem; color:#9ca3af; background:#fff; border:1px solid #e5e7eb; border-radius:10px; }
    .ca-state--err { color:#991b1b; background:#fef2f2; border-color:#fecaca; }
    .hidden-file { display:none; }

    .ca-hd { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.25rem; }
    .ca-title { font-size:1.45rem; font-weight:700; color:#111827; margin:0 0 3px; }
    .ca-sub { font-size:0.8rem; color:#9ca3af; }
    .ca-hd-right { display:flex; gap:0.6rem; flex-shrink:0; padding-top:2px; }
    .btn-ai { display:flex; align-items:center; gap:6px; padding:7px 14px; font-size:0.8rem; font-weight:500; background:#fff; border:1px solid #d1d5db; border-radius:7px; cursor:pointer; color:#374151; }
    .btn-ai:hover { background:#f9fafb; }
    .btn-add { display:flex; align-items:center; gap:6px; padding:7px 14px; font-size:0.8rem; font-weight:600; background:#ef4444; border:none; border-radius:7px; cursor:pointer; color:#fff; }
    .btn-add:hover:not(:disabled) { background:#dc2626; }
    .btn-add:disabled { opacity:0.6; cursor:not-allowed; }

    .progress-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:1.2rem 1.5rem; margin-bottom:1.1rem; }
    .progress-card-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
    .progress-card-title { font-size:0.9rem; font-weight:600; color:#111827; }
    .progress-card-pct { font-size:1rem; font-weight:700; color:#111827; }
    .progress-bar-track { height:7px; background:#f3f4f6; border-radius:4px; overflow:hidden; margin-bottom:1.1rem; }
    .progress-bar-fill { height:100%; background:linear-gradient(90deg,#ef4444,#f97316); border-radius:4px; transition:width .4s; }
    .progress-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:0; }
    .stat-box { text-align:center; padding:0.4rem 0; border-right:1px solid #f3f4f6; }
    .stat-box:last-child { border-right:none; }
    .stat-num { font-size:1.5rem; font-weight:700; color:#111827; line-height:1.1; }
    .stat-box--purple .stat-num { color:#7c3aed; }
    .stat-box--blue .stat-num { color:#2563eb; }
    .stat-box--green .stat-num { color:#16a34a; }
    .stat-label { font-size:0.72rem; color:#9ca3af; margin-top:2px; }

    .add-form-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:1.2rem 1.4rem; margin-bottom:1.1rem; }
    .add-form-title { font-size:0.88rem; font-weight:600; color:#111827; margin-bottom:1rem; }
    .form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:0.75rem; }
    .ff { margin-bottom:0.75rem; }
    .ff label { display:block; font-size:0.75rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px; }
    .ff input, .ff select, .ff textarea { width:100%; border:1px solid #e2e5e9; border-radius:7px; padding:8px 11px; font-size:0.85rem; color:#111827; box-sizing:border-box; background:#fff; font-family:inherit; }
    .ff textarea { resize:vertical; }
    .ff input:focus, .ff select:focus, .ff textarea:focus { outline:none; border-color:#6366f1; }
    .add-form-footer { display:flex; gap:0.6rem; justify-content:flex-end; margin-top:0.5rem; }
    .btn-cancel { background:none; border:1px solid #e5e7eb; border-radius:7px; padding:7px 14px; font-size:0.8rem; cursor:pointer; color:#6b7280; }
    .btn-save { background:#6366f1; color:#fff; border:none; border-radius:7px; padding:7px 16px; font-size:0.8rem; font-weight:600; cursor:pointer; }
    .btn-save:disabled { opacity:.45; cursor:not-allowed; }

    .action-list { display:flex; flex-direction:column; gap:0.6rem; }
    .action-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    .ac-row { display:flex; align-items:flex-start; gap:0.85rem; padding:1rem 1.25rem; cursor:pointer; user-select:none; }
    .ac-row:hover { background:#fafafa; }
    .ac-icon { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
    .icon-inprogress { background:#f5f3ff; color:#7c3aed; }
    .icon-open       { background:#eff6ff; color:#2563eb; }
    .icon-done       { background:#f0fdf4; color:#16a34a; }
    .ac-body { flex:1; min-width:0; }
    .ac-tags { display:flex; align-items:center; gap:0.4rem; margin-bottom:4px; flex-wrap:wrap; }
    .ac-ref { font-size:0.72rem; font-weight:600; color:#6b7280; }
    .badge-prio { font-size:0.67rem; font-weight:700; padding:2px 7px; border-radius:9px; }
    .prio-urgent { background:#fef2f2; color:#dc2626; }
    .prio-high   { background:#fff7ed; color:#c2410c; }
    .prio-normal { background:#f3f4f6; color:#4b5563; }
    .badge-status { font-size:0.67rem; font-weight:700; padding:2px 7px; border-radius:9px; }
    .status-inprogress { background:#f5f3ff; color:#7c3aed; }
    .status-open       { background:#eff6ff; color:#2563eb; }
    .status-completed  { background:#f0fdf4; color:#15803d; }
    .status-verified   { background:#f0fdf4; color:#16a34a; }
    .ac-title { font-size:0.88rem; font-weight:600; color:#111827; line-height:1.4; margin-bottom:3px; }
    .ac-meta  { font-size:0.74rem; color:#9ca3af; }
    .ac-right { display:flex; align-items:center; gap:0.75rem; flex-shrink:0; }
    .ac-pct-wrap { display:flex; align-items:center; gap:0.5rem; }
    .ac-mini-bar { width:80px; height:5px; background:#f3f4f6; border-radius:3px; overflow:hidden; }
    .ac-mini-fill { height:100%; border-radius:3px; transition:width .3s; background:linear-gradient(90deg,#ef4444,#f97316); }
    .ac-pct-lbl { font-size:0.78rem; font-weight:600; color:#374151; width:32px; text-align:right; }
    .chevron { color:#9ca3af; transition:transform .2s; flex-shrink:0; }
    .chevron--up { transform:rotate(180deg); }
    .ac-detail { padding:0 1.25rem 1rem 1.25rem; border-top:1px solid #f3f4f6; padding-top:1rem; }
    .ac-detail-row { display:grid; grid-template-columns:1fr auto; gap:1rem; align-items:end; margin-bottom:0.9rem; }
    .ac-detail-field label { display:block; font-size:0.75rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-bottom:5px; }
    .ac-detail-field input[type=text] { width:100%; border:1px solid #e2e5e9; border-radius:7px; padding:8px 11px; font-size:0.85rem; color:#111827; box-sizing:border-box; }
    .ac-detail-field input[type=text]:focus { outline:none; border-color:#6366f1; }
    .pct-slider { width:160px; accent-color:#ef4444; cursor:pointer; }
    .ac-evidence-list { display:flex; flex-direction:column; gap:0.4rem; margin-bottom:0.9rem; }
    .ac-evidence-item { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.7rem; background:#f9fafb; border-radius:7px; font-size:0.78rem; color:#374151; }
    .ac-evidence-note { font-weight:600; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ac-evidence-meta { color:#9ca3af; font-size:0.72rem; flex-shrink:0; }
    .ac-detail-actions { display:flex; gap:0.6rem; }
    .btn-upload { display:flex; align-items:center; gap:6px; padding:7px 14px; font-size:0.79rem; font-weight:500; background:#fff; border:1px solid #d1d5db; border-radius:7px; cursor:pointer; color:#374151; }
    .btn-upload:hover { background:#f9fafb; }
    .btn-complete { display:flex; align-items:center; gap:6px; padding:7px 16px; font-size:0.79rem; font-weight:600; background:#16a34a; border:none; border-radius:7px; cursor:pointer; color:#fff; }
    .btn-complete:hover:not(:disabled) { background:#15803d; }
    .btn-complete:disabled { opacity:0.6; cursor:not-allowed; }

    @media (max-width:700px) {
      .progress-stats { grid-template-columns:1fr 1fr; }
      .form-row-2 { grid-template-columns:1fr; }
      .ac-detail-row { grid-template-columns:1fr; }
    }
  `]
})
export class CorrectiveActionsComponent implements OnInit {
  incidentId = '';
  incidentRef = 'INC-2024-0892';
  actions = signal<CaAction[]>([]);
  evidence = signal<IncidentAttachment[]>([]);
  showAddForm = signal(false);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  toast = signal<{ type: 'ok' | 'err'; msg: string } | null>(null);

  private expandedIds = new Set<string>();
  private evidenceActionId: string | null = null;

  newAction = {
    title: '',
    priority: 'Normal' as CaAction['priority'],
    team: '',
    dueDate: '',
    description: '',
  };

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private capaService: CapaService,
    private incidentService: IncidentService,
    private recentIncident: RecentIncidentService,
  ) {}

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id') ?? '';
    this.incidentRef = routeId;
    this.loadIncident(routeId);
  }

  overallPct = computed(() => {
    const list = this.actions();
    if (!list.length) return 0;
    return Math.round(list.reduce((s, a) => s + a.completionPct, 0) / list.length);
  });

  countByStatus(status: string): number {
    return this.actions().filter(a => a.status === status).length;
  }

  evidenceFor(actionId: string): IncidentAttachment[] {
    return this.evidence().filter(e => e.correctiveActionId === actionId);
  }

  toggle(action: CaAction): void {
    if (this.expandedIds.has(action.id)) {
      this.expandedIds.delete(action.id);
    } else {
      this.expandedIds.add(action.id);
    }
    this.actions.update(list =>
      list.map(a => a.id === action.id ? { ...a, expanded: this.expandedIds.has(a.id) } : a),
    );
  }

  addAction(): void {
    if (!this.incidentId || !this.newAction.title.trim()) return;
    this.saving.set(true);
    this.capaService.createAction(this.incidentId, {
      title: this.newAction.title.trim(),
      description: this.newAction.description.trim() || null,
      owner: this.newAction.team.trim() || null,
      dueDate: this.newAction.dueDate ? new Date(this.newAction.dueDate).toISOString() : null,
      priority: PRIORITY_TO_API[this.newAction.priority],
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.newAction = { title: '', priority: 'Normal', team: '', dueDate: '', description: '' };
        this.showAddForm.set(false);
        this.showToast('ok', 'Corrective action created.');
        this.loadActions();
      },
      error: () => {
        this.saving.set(false);
        this.showToast('err', 'Failed to create action.');
      },
    });
  }

  saveCompletion(action: CaAction): void {
    this.capaService.updateAction(action.id, { completionPercentage: action.completionPct }).subscribe({
      next: () => this.loadActions(false),
      error: () => this.showToast('err', 'Failed to update progress.'),
    });
  }

  saveVerifiedBy(action: CaAction): void {
    const verifiedBy = action.verificationMethod.trim();
    this.capaService.updateAction(action.id, { verifiedBy: verifiedBy || null }).subscribe({
      next: () => this.showToast('ok', 'Verifier saved.'),
      error: () => this.showToast('err', 'Failed to save verifier.'),
    });
  }

  markComplete(action: CaAction): void {
    this.saving.set(true);
    this.capaService.completeAction(action.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.showToast('ok', 'Action marked complete.');
        this.loadActions();
      },
      error: () => {
        this.saving.set(false);
        this.showToast('err', 'Failed to complete action.');
      },
    });
  }

  pickEvidence(action: CaAction): void {
    this.evidenceActionId = action.id;
    const input = document.querySelector('.hidden-file') as HTMLInputElement | null;
    input?.click();
  }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.evidenceActionId) return;
    this.capaService.uploadEvidence(this.evidenceActionId, file).subscribe({
      next: () => {
        this.showToast('ok', 'Evidence uploaded.');
        input.value = '';
        this.evidenceActionId = null;
        this.loadEvidence();
      },
      error: () => {
        this.showToast('err', 'Failed to upload evidence.');
        input.value = '';
        this.evidenceActionId = null;
      },
    });
  }

  statusIconClass(s: CaAction['status']): string {
    if (s === 'In Progress') return 'icon-inprogress';
    if (s === 'Completed' || s === 'Verified') return 'icon-done';
    return 'icon-open';
  }

  prioCls(p: CaAction['priority']): string {
    return { Urgent: 'badge-prio prio-urgent', High: 'badge-prio prio-high', Normal: 'badge-prio prio-normal' }[p] ?? 'badge-prio prio-normal';
  }

  statusCls(s: CaAction['status']): string {
    const m: Record<string, string> = {
      'In Progress': 'badge-status status-inprogress',
      'Open':        'badge-status status-open',
      'Completed':   'badge-status status-completed',
      'Verified':    'badge-status status-verified',
    };
    return m[s] ?? 'badge-status status-open';
  }

  private loadIncident(idOrRef: string): void {
    if (!idOrRef) {
      this.loading.set(false);
      this.error.set('No incident specified.');
      return;
    }
    this.incidentService.getIncident(idOrRef).subscribe({
      next: inc => {
        this.incidentId = inc.id;
        this.incidentRef = inc.incidentReference;
        this.recentIncident.setLastViewed(inc.incidentReference);
        this.loadActions();
      },
      error: () => {
        if (isGuid(idOrRef)) {
          this.incidentId = idOrRef;
          this.loadActions();
        } else {
          this.loading.set(false);
          this.error.set('Incident not found.');
        }
      },
    });
  }

  private loadActions(showSpinner = true): void {
    if (!this.incidentId) return;
    if (showSpinner) this.loading.set(true);
    this.capaService.getActions(this.incidentId).subscribe({
      next: list => {
        this.actions.set(list.map((a, i) => this.toCaAction(a, i)));
        this.loading.set(false);
        this.error.set(null);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load corrective actions.');
      },
    });
    this.loadEvidence();
  }

  private loadEvidence(): void {
    if (!this.incidentId) return;
    this.incidentService.getAttachments(this.incidentId).subscribe({
      next: list => this.evidence.set(list),
      error: () => this.evidence.set([]),
    });
  }

  private toCaAction(a: CorrectiveAction, index: number): CaAction {
    return {
      id: a.id,
      ref: `CA-${String(index + 1).padStart(3, '0')}`,
      priority: priorityLabel(a.priority),
      status: statusDisplay(a.status),
      title: a.title,
      team: a.owner || '—',
      dueDate: formatDueDate(a.dueDate),
      completionPct: a.completionPercentage,
      verificationMethod: a.verifiedBy || '',
      expanded: this.expandedIds.has(a.id),
    };
  }

  showToast(type: 'ok' | 'err', msg: string): void {
    this.toast.set({ type, msg });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
