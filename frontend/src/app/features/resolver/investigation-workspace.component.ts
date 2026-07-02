import { Component, OnInit, signal, inject, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  InvestigationService,
  InvestigationWorkspace,
  EvidenceItem,
  ChecklistItem
} from './investigation.service';
import { CapaTrackerComponent } from './capa-tracker.component';
import { AuthService } from '../../core/services/auth.service';
import { RecentIncidentService } from '../../core/services/recent-incident.service';

@Component({
  selector: 'app-investigation-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, CapaTrackerComponent],
  template: `
    <div class="ws-page">

      <!-- ── Page Header ── -->
      <div class="ws-hd">
        <button class="back-btn" (click)="router.navigate(['/investigation/queue'])" title="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div class="ws-hd-titles">
          <h1 class="ws-hd-title">Investigation Workspace</h1>
          <div class="ws-hd-sub">
            @if (workspace(); as ws) {
              {{ ws.incidentReference }}@if (ws.incidentTitle) { — {{ ws.incidentTitle }} }
            } @else {
              {{ incidentId }}
            }
          </div>
        </div>

        <div class="ws-hd-right">
          @if (saving()) { <span class="save-tag">Saving…</span> }
          @if (saved())  { <span class="save-tag save-tag--ok">Saved ✓</span> }

          @if (workspace(); as ws) {
            <div class="investigator">
              <div class="investigator-label">Investigator</div>
              <div class="investigator-name">{{ investigatorName(ws) }}</div>
            </div>
            <div class="avatar">{{ investigatorInitials(ws) }}</div>
          }

          <button class="resolve-btn"
            [disabled]="!canResolve() || resolving()"
            (click)="resolve()">
            {{ resolving() ? 'Resolving…' : 'Mark Resolved' }}
          </button>
          <button class="save-progress-btn" [disabled]="saving()" (click)="saveProgress()">
            {{ saving() ? 'Saving…' : 'Save Progress' }}
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="ws-error">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="ws-loading">Loading workspace…</div>
      }

      @if (workspace(); as ws) {
        <div class="ws-body">

          <!-- ═══ LEFT COLUMN ═══ -->
          <div class="ws-left">

            <!-- Investigation Details -->
            <div class="ws-card">
              <div class="ws-card-hd">Investigation Details</div>

              <div class="ws-grid2">
                <div class="ws-field">
                  <label>Investigation Owner</label>
                  <input #ownerInput type="text" [value]="ws.owner ?? ''"
                    (blur)="saveField('owner', $any($event.target).value)"
                    placeholder="Assign investigator…">
                </div>
                <div class="ws-field">
                  <label>Investigation Date</label>
                  <input #investigationDateInput type="date" [value]="toDate(ws.investigationDate)"
                    (blur)="saveField('investigationDate', $any($event.target).value || null)">
                </div>
                <div class="ws-field">
                  <label>Target Completion</label>
                  <input #targetCompletionInput type="date" [value]="toDate(ws.targetCompletionDate)"
                    (blur)="saveField('targetCompletionDate', $any($event.target).value || null)">
                </div>
                <div class="ws-field">
                  <label>Risk Assessment Level</label>
                  <select #riskLevelSelect [value]="ws.riskLevel ?? ''"
                    (change)="saveField('riskLevel', $any($event.target).value || null)">
                    <option value="">— Select risk level —</option>
                    <option value="High">High Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Low">Low Risk</option>
                  </select>
                </div>
              </div>

              <div class="ws-field">
                <label>Investigation Notes</label>
                <textarea #notesInput rows="5" [value]="ws.notes ?? ''"
                  (blur)="saveField('notes', $any($event.target).value)"
                  placeholder="Document your investigation notes…"></textarea>
              </div>

              <div class="ws-field">
                <label>Findings Summary</label>
                <textarea #findingsInput rows="4" [value]="ws.findingsSummary ?? ''"
                  (blur)="saveField('findingsSummary', $any($event.target).value)"
                  placeholder="Summarise key findings…"></textarea>
              </div>

              <div class="ws-field">
                <label>Immediate Action Taken</label>
                <textarea #immediateActionInput rows="3" [value]="ws.immediateActionTaken ?? ''"
                  (blur)="saveField('immediateActionTaken', $any($event.target).value)"
                  placeholder="Describe immediate corrective actions…"></textarea>
              </div>

              <div class="ws-field" style="margin-bottom:0">
                <label>Lessons Learned</label>
                <textarea #lessonsInput rows="3" [value]="ws.lessonsLearned ?? ''"
                  (blur)="saveField('lessonsLearned', $any($event.target).value)"
                  placeholder="Key lessons for future prevention…"></textarea>
              </div>
            </div>

            <!-- Evidence -->
            <div class="ws-card">
              <div class="ws-card-hd">
                Evidence
                <label class="add-evidence-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Evidence
                  <input type="file" accept="image/*,video/*,.pdf,.doc,.docx"
                    (change)="onFileSelect($event)" style="display:none">
                </label>
              </div>

              @if (evidenceLoading()) {
                <p class="ws-dim">Loading evidence…</p>
              } @else {
                <div class="evidence-list">
                  @for (ev of evidence(); track ev.id) {
                    <div class="evidence-item">
                      <div class="evidence-icon">{{ mimeIcon(ev.mimeType) }}</div>
                      <div class="evidence-info">
                        <div class="evidence-note">{{ ev.evidenceNote ?? ev.storageKey }}</div>
                        <div class="evidence-meta">
                          By {{ ev.uploaderName ?? 'Unknown' }} · {{ ev.uploadedAt | date:'HH:mm' }}
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <label class="evidence-drop">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626"
                    stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span><strong>Upload evidence</strong> — photos, videos, documents</span>
                  <input type="file" accept="image/*,video/*,.pdf,.doc,.docx"
                    (change)="onFileSelect($event)" style="display:none">
                </label>
              }

              @if (uploading()) {
                <p class="ws-dim" style="margin-top:0.5rem">Uploading…</p>
              }
            </div>

            <!-- CAPA Tracker -->
            <app-capa-tracker
              [incidentId]="incidentId"
              (actionsCountChanged)="canResolve.set($event > 0)">
            </app-capa-tracker>

          </div>

          <!-- ═══ RIGHT COLUMN ═══ -->
          <div class="ws-right">

            <!-- Checklist -->
            <div class="ws-card">
              <div class="ws-card-hd">
                Checklist
                <span class="cl-count">{{ completedCount(ws) }}/{{ ws.checklistItems.length }}</span>
              </div>

              <div class="cl-progress">
                <div class="cl-progress-fill" [style.width.%]="progressPct(ws)"></div>
              </div>

              <ul class="checklist">
                @for (item of ws.checklistItems; track item.id) {
                  <li class="cl-item" [class.cl-item--done]="item.isCompleted" (click)="toggleItem(item)">
                    <div class="cl-check" [class.cl-check--done]="item.isCompleted">
                      @if (item.isCompleted) {
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white"
                          stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      }
                    </div>
                    <span>{{ item.label }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- AI Root Cause Assistant (FS-13 stub) -->
            <div class="ws-card ai-card">
              <div class="ai-hd">
                <div class="ai-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4l1.4-1.4m10-10 1.4-1.4"/>
                    <circle cx="12" cy="12" r="3.5"/>
                  </svg>
                </div>
                <div>
                  <div class="ai-title">AI Root Cause Assistant</div>
                  <div class="ai-sub">Pattern analysis from 2,400+ incidents</div>
                </div>
              </div>
              <button class="ai-btn" disabled title="Coming soon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4l1.4-1.4m10-10 1.4-1.4"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Analyze Root Causes
              </button>
            </div>

            <!-- Timeline -->
            <div class="ws-card">
              <div class="ws-card-hd">Timeline</div>
              <div class="timeline">
                @for (ev of ws.timelineEvents; track ev.id) {
                  <div class="tl-event">
                    <div class="tl-time">{{ ev.occurredAt | date:'HH:mm' }}</div>
                    <div class="tl-dot"></div>
                    <div class="tl-desc">{{ ev.description }}</div>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .ws-page { padding: 1.375rem 1.75rem 2.5rem; max-width: 1400px; margin: 0 auto; background:#f5f6fa; }

    /* Header */
    .ws-hd { display:flex; align-items:flex-start; gap:0.9rem; margin-bottom:1.25rem; }
    .ws-hd-titles { flex:1; min-width:0; }
    .ws-hd-title { font-size:1.25rem; font-weight:700; color:#1a1d29; margin:0; line-height:1.2; }
    .ws-hd-sub { font-size:0.78rem; color:#8a8fa3; margin-top:3px; }
    .ws-hd-right { display:flex; align-items:center; gap:0.625rem; }
    .back-btn { display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:#fff; border:1px solid #e7e9f0; border-radius:8px; color:#4b5060; cursor:pointer; flex-shrink:0; }
    .back-btn:hover { background:#f5f6fa; }
    .save-tag { font-size:0.73rem; color:#8a8fa3; }
    .save-tag--ok { color:#22a35e; font-weight:500; }

    .investigator { text-align:right; line-height:1.3; }
    .investigator-label { font-size:0.66rem; color:#8a8fa3; }
    .investigator-name { font-size:0.78rem; font-weight:600; color:#1a1d29; }
    .avatar { width:32px; height:32px; border-radius:50%; background:#f0a63a; color:#4a3200; display:flex; align-items:center; justify-content:center; font-size:0.69rem; font-weight:700; flex-shrink:0; }

    .resolve-btn { background:#22a35e; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:0.82rem; font-weight:600; cursor:pointer; white-space:nowrap; }
    .resolve-btn:not(:disabled):hover { background:#1c8a4f; }
    .resolve-btn:disabled { opacity:.4; cursor:not-allowed; }
    .save-progress-btn { background:#e11d2e; color:#fff; border:none; border-radius:8px; padding:9px 18px; font-size:0.82rem; font-weight:600; cursor:pointer; white-space:nowrap; }
    .save-progress-btn:hover { background:#c81625; }

    /* Layout — wide left, medium right (matches Figma) */
    .ws-body { display:grid; grid-template-columns:1fr 320px; gap:1.25rem; align-items:start; }
    .ws-left { display:flex; flex-direction:column; gap:1.25rem; }
    .ws-right { display:flex; flex-direction:column; gap:1.25rem; }

    /* Card */
    .ws-card { background:#fff; border:1px solid #e7e9f0; border-radius:12px; padding:1.25rem; box-shadow:0 1px 2px rgba(0,0,0,.03); }
    .ws-card-hd { font-size:0.906rem; font-weight:700; color:#1a1d29; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; }

    /* Form */
    .ws-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
    .ws-field { margin-bottom:1rem; }
    .ws-field label { display:block; font-size:0.75rem; font-weight:600; color:#4b5060; margin-bottom:6px; }
    .ws-field input, .ws-field select { width:100%; border:1px solid #e7e9f0; border-radius:8px; padding:9px 12px; font-size:0.82rem; color:#1a1d29; background:#fff; box-sizing:border-box; }
    .ws-field textarea { width:100%; border:1px solid #e7e9f0; border-radius:8px; padding:9px 12px; font-size:0.82rem; color:#1a1d29; resize:vertical; box-sizing:border-box; line-height:1.5; font-family:inherit; }
    .ws-field input:focus, .ws-field select:focus, .ws-field textarea:focus { outline:none; border-color:#e11d2e; box-shadow:0 0 0 3px rgba(225,29,46,.1); }

    /* Evidence */
    .add-evidence-btn { display:flex; align-items:center; gap:6px; font-size:0.78rem; font-weight:600; color:#4b5060; cursor:pointer; border:1px solid #e7e9f0; border-radius:8px; padding:6px 14px; background:#fff; }
    .add-evidence-btn:hover { background:#f5f6fa; }
    .evidence-list { display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem; }
    .evidence-item { display:flex; align-items:center; gap:0.6rem; padding:0.6rem; background:#f5f6fa; border-radius:8px; }
    .evidence-icon { font-size:1.05rem; line-height:1; width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:#dfe3ee; border-radius:6px; flex-shrink:0; color:#4b5060; }
    .evidence-info { flex:1; min-width:0; }
    .evidence-note { font-size:0.78rem; color:#1a1d29; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .evidence-meta { font-size:0.69rem; color:#8a8fa3; margin-top:2px; }
    .evidence-drop { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:1.375rem; color:#e11d2e; font-size:0.78rem; font-weight:600; text-align:center; border:1.5px dashed #f3b3ae; background:#fef6f6; border-radius:10px; cursor:pointer; }
    .evidence-drop:hover { border-color:#e11d2e; }
    .evidence-drop strong { color:#e11d2e; font-weight:600; }

    /* Checklist */
    .cl-count { font-size:0.75rem; font-weight:600; color:#8a8fa3; }
    .cl-progress { height:5px; background:#e7e9f0; border-radius:3px; overflow:hidden; margin-bottom:1rem; }
    .cl-progress-fill { height:100%; background:#22a35e; border-radius:3px; transition:width .3s ease; }
    .checklist { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.375rem; }
    .cl-item { display:flex; align-items:center; gap:0.625rem; padding:0.5rem 0.625rem; border-radius:8px; cursor:pointer; transition:all .15s; }
    .cl-item:hover { background:#f5f6fa; }
    .cl-item--done { background:#eafaf1; }
    .cl-check { width:18px; height:18px; border-radius:50%; border:1.5px solid #e7e9f0; background:#fff; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all .15s; }
    .cl-check--done { background:#22a35e; border-color:#22a35e; }
    .cl-item span { font-size:0.78rem; color:#1a1d29; line-height:1.4; }
    .cl-item--done span { color:#8a8fa3; text-decoration:line-through; }

    /* AI stub */
    .ai-card { background:linear-gradient(135deg,#f1edfd,#f7f4fe); border-color:#e2d9fb; }
    .ai-hd { display:flex; align-items:center; gap:0.625rem; margin-bottom:1rem; }
    .ai-icon { width:34px; height:34px; border-radius:9px; background:#6d4ee0; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ai-title { font-size:0.78rem; font-weight:700; color:#1a1d29; }
    .ai-sub { font-size:0.69rem; color:#8a8fa3; margin-top:1px; }
    .ai-btn { width:100%; background:#6d4ee0; color:#fff; border:none; border-radius:8px; padding:11px; font-size:0.78rem; font-weight:600; cursor:not-allowed; display:flex; align-items:center; justify-content:center; gap:7px; }
    .ai-btn:not(:disabled):hover { background:#5a3fd0; }

    /* Timeline */
    .timeline { display:flex; flex-direction:column; gap:0; }
    .tl-event { display:grid; grid-template-columns:44px 12px 1fr; align-items:start; gap:0.5rem; padding:0.5rem 0; }
    .tl-time { font-size:0.69rem; color:#8a8fa3; font-weight:600; padding-top:1px; }
    .tl-dot { width:9px; height:9px; border-radius:50%; background:#22a35e; margin-top:4px; }
    .tl-desc { font-size:0.78rem; color:#1a1d29; font-weight:600; }

    /* Util */
    .ws-error { background:#fef2f2; border:1px solid #fca5a5; color:#dc2626; padding:0.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:0.82rem; }
    .ws-loading, .ws-dim { color:#9ca3af; font-size:0.85rem; padding:0.5rem 0; }

    @media (max-width: 900px) {
      .ws-body { grid-template-columns:1fr; }
      .ws-grid2 { grid-template-columns:1fr; }
    }
  `]
})
export class InvestigationWorkspaceComponent implements OnInit {
  incidentId = '';
  workspace = signal<InvestigationWorkspace | null>(null);
  evidence = signal<EvidenceItem[]>([]);
  loading = signal(true);
  evidenceLoading = signal(true);
  uploading = signal(false);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);
  canResolve = signal(false);
  resolving = signal(false);

  private auth = inject(AuthService);
  private recentIncident = inject(RecentIncidentService);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private svc: InvestigationService
  ) {}

  ngOnInit(): void {
    this.incidentId = this.route.snapshot.paramMap.get('id') ?? '';
    this.svc.openInvestigation(this.incidentId).subscribe({
      next: () => { this.loadWorkspace(); this.loadEvidence(); },
      error: err => {
        this.error.set(err?.error?.error ?? 'Failed to open investigation.');
        this.loading.set(false);
      }
    });
  }

  private loadWorkspace(): void {
    this.svc.getInvestigation(this.incidentId).subscribe({
      next: ws => {
        this.workspace.set(ws);
        this.loading.set(false);
        this.recentIncident.setLastViewed(ws.incidentReference);
      },
      error: () => { this.error.set('Failed to load workspace.'); this.loading.set(false); }
    });
  }

  private loadEvidence(): void {
    this.svc.getAttachments(this.incidentId).subscribe({
      next: list => { this.evidence.set(list); this.evidenceLoading.set(false); },
      error: () => this.evidenceLoading.set(false)
    });
  }

  private ownerInput = viewChild<ElementRef<HTMLInputElement>>('ownerInput');
  private investigationDateInput = viewChild<ElementRef<HTMLInputElement>>('investigationDateInput');
  private targetCompletionInput = viewChild<ElementRef<HTMLInputElement>>('targetCompletionInput');
  private riskLevelSelect = viewChild<ElementRef<HTMLSelectElement>>('riskLevelSelect');
  private notesInput = viewChild<ElementRef<HTMLTextAreaElement>>('notesInput');
  private findingsInput = viewChild<ElementRef<HTMLTextAreaElement>>('findingsInput');
  private immediateActionInput = viewChild<ElementRef<HTMLTextAreaElement>>('immediateActionInput');
  private lessonsInput = viewChild<ElementRef<HTMLTextAreaElement>>('lessonsInput');

  /** Explicit "Save Progress" — bundles every editable field into a single save call. */
  saveProgress(): void {
    if (!this.workspace() || this.saving()) return;

    this.saving.set(true);
    this.saved.set(false);

    this.svc.saveInvestigation(this.incidentId, {
      owner: this.ownerInput()?.nativeElement.value || null,
      investigationDate: this.investigationDateInput()?.nativeElement.value || null,
      targetCompletionDate: this.targetCompletionInput()?.nativeElement.value || null,
      riskLevel: this.riskLevelSelect()?.nativeElement.value || null,
      notes: this.notesInput()?.nativeElement.value || null,
      findingsSummary: this.findingsInput()?.nativeElement.value || null,
      immediateActionTaken: this.immediateActionInput()?.nativeElement.value || null,
      lessonsLearned: this.lessonsInput()?.nativeElement.value || null,
    }).subscribe({
      next: () => {
        this.svc.getInvestigation(this.incidentId).subscribe({
          next: updated => {
            this.workspace.set(updated);
            this.saving.set(false);
            this.saved.set(true);
            setTimeout(() => this.saved.set(false), 2000);
          }
        });
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Save failed. Please try again.');
        setTimeout(() => this.error.set(null), 3000);
      }
    });
  }

  saveField(field: string, value: string | null): void {
    const ws = this.workspace();
    if (!ws) return;
    const existing = (ws as unknown as Record<string, unknown>)[field];
    if (existing === value || (!existing && !value)) return;

    this.saving.set(true);
    this.saved.set(false);

    this.svc.saveInvestigation(this.incidentId, { [field]: value || null }).subscribe({
      next: () => {
        this.svc.getInvestigation(this.incidentId).subscribe({
          next: updated => {
            this.workspace.set(updated);
            this.saving.set(false);
            this.saved.set(true);
            setTimeout(() => this.saved.set(false), 2000);
          }
        });
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Save failed. Please try again.');
        setTimeout(() => this.error.set(null), 3000);
      }
    });
  }

  toggleItem(item: ChecklistItem): void {
    this.svc.toggleChecklistItem(this.incidentId, item.id).subscribe({
      next: result => {
        const ws = this.workspace();
        if (!ws) return;
        const updated = {
          ...ws,
          checklistItems: ws.checklistItems.map(c =>
            c.id === item.id ? { ...c, isCompleted: result.isCompleted } : c
          )
        };
        this.workspace.set(updated);
      }
    });
  }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.svc.uploadEvidence(this.incidentId, file).subscribe({
      next: () => { this.loadEvidence(); this.uploading.set(false); },
      error: () => this.uploading.set(false)
    });
  }

  resolve(): void {
    if (!this.canResolve() || this.resolving()) return;
    this.resolving.set(true);
    this.svc.resolveIncident(this.incidentId).subscribe({
      next: () => this.router.navigate(['/investigation/queue']),
      error: err => {
        this.resolving.set(false);
        this.error.set(err?.error?.error ?? 'Failed to resolve incident. Ensure at least one CAPA action exists.');
        setTimeout(() => this.error.set(null), 4000);
      }
    });
  }

  mimeIcon(mime: string): string {
    if (mime.startsWith('image/')) return '📷';
    if (mime.startsWith('video/')) return '🎥';
    if (mime === 'application/pdf') return '📄';
    return '📎';
  }

  toDate(val: string | null): string {
    return val ? val.substring(0, 10) : '';
  }

  completedCount(ws: InvestigationWorkspace): number {
    return ws.checklistItems.filter(c => c.isCompleted).length;
  }

  progressPct(ws: InvestigationWorkspace): number {
    const total = ws.checklistItems.length;
    return total === 0 ? 0 : Math.round((this.completedCount(ws) / total) * 100);
  }

  investigatorName(ws: InvestigationWorkspace): string {
    if (ws.owner && ws.owner.trim()) {
      return ws.owner.split(/[—–-]/)[0].trim();
    }
    const email = this.auth.currentEmail();
    if (email) {
      const local = email.split('@')[0];
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return 'Investigator';
  }

  investigatorInitials(ws: InvestigationWorkspace): string {
    const name = this.investigatorName(ws);
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
}
