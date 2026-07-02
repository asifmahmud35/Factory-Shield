import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RcaService, FishboneCategoriesDto } from './rca.service';
import { IncidentService } from '../../incidents/incident.service';
import { RecentIncidentService } from '../../../core/services/recent-incident.service';

export interface WhyEntry { id: string; label: string; text: string; }
export interface FishboneCategory { key: string; label: string; causes: string[]; }
export interface SimilarIncident { ref: string; title: string; date: string; match: number; }

const CHECKLIST_ITEMS = [
  { id: 'physical',     label: 'Physical cause identified' },
  { id: 'human',        label: 'Human factor analyzed' },
  { id: 'system',       label: 'System/management cause found' },
  { id: 'contributing', label: 'Contributing factors documented' },
  { id: 'historical',   label: 'Historical comparison done' },
  { id: 'lessons',      label: 'Lessons learned documented' },
];

const DEFAULT_SUMMARY = '';

const ROOT_CAUSE_CATEGORIES = [
  'Equipment / Machine', 'Human Error', 'Process / Procedure',
  'Environment', 'Materials', 'Management / Supervision',
];

@Component({
  selector: 'app-rca',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="rca-page">

  @if (toast()) {
    <div [class]="'rca-toast rca-toast--' + toast()!.type">{{ toast()!.msg }}</div>
  }

  <div class="rca-shell">

    <!-- MAIN -->
    <div class="main">
      <div class="page-head">
        <div class="page-title">
          <h1>Root Cause Analysis</h1>
          <p>{{ incidentRef }} — {{ incidentTitle }}</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="saveDraft()" [disabled]="saving() || rcaSubmitted()">Save Draft</button>
          <button type="button" class="btn btn-solid" (click)="submitRca()" [disabled]="saving() || rcaSubmitted()">Submit RCA</button>
        </div>
      </div>

      <div class="method-tabs">
        <button type="button" [class]="tabClass('5why')" (click)="setMethod('5why')">
          <div class="t">5 Why Analysis</div>
          <div class="d">Iterative questioning to find root cause</div>
        </button>
        <button type="button" [class]="tabClass('fishbone')" (click)="setMethod('fishbone')">
          <div class="t">Fishbone Diagram</div>
          <div class="d">Cause and effect (Ishikawa) diagram</div>
        </button>
        <button type="button" [class]="tabClass('structured')" (click)="setMethod('structured')">
          <div class="t">Structured RCA</div>
          <div class="d">Free-form structured analysis</div>
        </button>
      </div>

      @if (activeMethod() === '5why') {
        <div class="card">
          <h2 class="card-title">5 Why Analysis</h2>

          <div class="why-row">
            <div class="why-badge why-badge--p">P</div>
            <div class="why-body">
              <div class="why-label">Problem Statement</div>
              <div class="field-row">
                @if (isExpanded('problem')) {
                  <textarea class="why-input why-textarea" rows="3" [(ngModel)]="problemStatement"
                    (ngModelChange)="syncRootCause()" placeholder="Describe the problem…"></textarea>
                } @else {
                  <input class="why-input" [(ngModel)]="problemStatement"
                    (ngModelChange)="syncRootCause()" placeholder="Describe the problem…">
                }
                <div class="field-icon" [title]="isExpanded('problem') ? 'Collapse' : 'Expand'" (click)="toggleExpand('problem')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    @if (isExpanded('problem')) {
                      <polyline points="18 15 12 9 6 15"/>
                    } @else {
                      <polyline points="6 9 12 15 18 9"/>
                    }
                  </svg>
                </div>
              </div>
            </div>
          </div>

          @for (why of whys(); track why.id; let i = $index) {
            <div class="why-row">
              <div [class]="'why-badge' + (isRootWhy(i) ? ' why-badge--root' : ' why-badge--w')">{{ why.label }}</div>
              <div class="why-body">
                <div [class]="'why-label' + (isRootWhy(i) ? ' root' : '')">
                  @if (isRootWhy(i)) {
                    Why {{ i + 1 }}? (Root Cause)
                  } @else {
                    Why {{ i + 1 }}?
                  }
                </div>
                <div class="field-row">
                  @if (isExpanded(why.id)) {
                    <textarea class="why-input why-textarea" rows="2" [(ngModel)]="why.text"
                      (ngModelChange)="syncRootCause()" [placeholder]="whyPlaceholder(i)"></textarea>
                  } @else {
                    <input class="why-input" [(ngModel)]="why.text"
                      (ngModelChange)="syncRootCause()" [placeholder]="whyPlaceholder(i)">
                  }
                  @if (showRemoveIcon(i)) {
                    <div class="field-icon" title="Remove" (click)="removeWhy(why.id)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                  }
                  @if (showChevronIcon(i)) {
                    <div class="field-icon" [title]="isExpanded(why.id) ? 'Collapse' : 'Expand'" (click)="toggleExpand(why.id)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        @if (isExpanded(why.id)) {
                          <polyline points="18 15 12 9 6 15"/>
                        } @else {
                          <polyline points="6 9 12 15 18 9"/>
                        }
                      </svg>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          @if (whys().length < 7) {
            <button type="button" class="add-why" (click)="addWhy()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add another Why
            </button>
          }

          <div class="root-cause-box">
            <div class="root-cause-label">Root Cause Identified</div>
            <textarea class="why-input root-cause-edit" rows="2" [(ngModel)]="rootCauseSummary"
              (ngModelChange)="onRootCauseEdit()" placeholder="Complete the analysis above or enter the root cause…"></textarea>
          </div>
        </div>
      }

      @if (activeMethod() === 'fishbone') {
        <div class="card">
          <h2 class="card-title">Fishbone (Ishikawa) Diagram</h2>
          <div class="effect-pill-wrap">
            <div class="effect-pill">Effect: {{ problemStatement || 'Needle Penetration Injury' }}</div>
          </div>
          <div class="fishbone-grid">
            @for (cat of fishboneCategories; track cat.key) {
              <div class="fish-cat-card">
                <div class="fish-cat-hd">
                  <span class="fish-cat-title">{{ cat.label }}</span>
                  <button type="button" class="fish-cat-add" (click)="addCause(cat)" title="Add cause">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
                @if (cat.causes.length === 0) {
                  <p class="fish-empty">No causes identified</p>
                } @else {
                  <ul class="fish-causes">
                    @for (cause of cat.causes; track $index) {
                      <li class="fish-cause-item">
                        <span class="fish-dot"></span>
                        <span>{{ cause }}</span>
                        <button type="button" class="fish-cause-remove" (click)="removeCause(cat, $index)" title="Remove">×</button>
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (activeMethod() === 'structured') {
        <div class="card">
          <h2 class="card-title">Structured Root Cause Analysis</h2>
          <div class="str-field">
            <label>Root Cause Category</label>
            <select [(ngModel)]="structuredData.category">
              @for (opt of rootCauseCategories; track opt) {
                <option [value]="opt">{{ opt }}</option>
              }
            </select>
          </div>
          <div class="str-field">
            <label>Root Cause Description</label>
            <textarea rows="4" [(ngModel)]="structuredData.description"
              (ngModelChange)="syncRootCause()" placeholder="Describe the root cause in detail…"></textarea>
          </div>
          <div class="str-field">
            <label>Contributing Factors</label>
            <textarea rows="4" [(ngModel)]="structuredData.contributing" placeholder="List all contributing factors…"></textarea>
          </div>
          <div class="str-field">
            <label>Verification Method</label>
            <textarea rows="3" [(ngModel)]="structuredData.verification" placeholder="How was this root cause verified?"></textarea>
          </div>
          <div class="str-field str-field--last">
            <label>Lessons Learned</label>
            <textarea rows="3" [(ngModel)]="structuredData.lessons" placeholder="Key lessons that apply to other areas…"></textarea>
          </div>
        </div>
      }
    </div>

    <!-- RIGHT RAIL -->
    <div class="right-rail">

      <div class="panel">
        <div class="panel-head">
          <div class="panel-icon">
            <svg viewBox="0 0 24 24"><path d="M12 2l1.6 4.8L18 8l-4.4 1.2L12 14l-1.6-4.8L6 8l4.4-1.2z"/></svg>
          </div>
          <div>
            <b>AI RCA Recommendations</b>
            <span>Based on historical patterns</span>
          </div>
        </div>
        <button type="button" class="ai-btn" (click)="generateRecommendations()" [disabled]="generatingAi() || rcaSubmitted()">
          <svg viewBox="0 0 24 24"><path d="M12 2l1.6 4.8L18 8l-4.4 1.2L12 14l-1.6-4.8L6 8l4.4-1.2z"/></svg>
          {{ generatingAi() ? 'Generating…' : 'Generate Recommendations' }}
        </button>
      </div>

      <div class="panel">
        <h3 class="panel-title">RCA Checklist</h3>
        @for (item of checklist(); track item.id) {
          <div [class]="'checklist-item' + (item.done ? ' done-text done-row' : '')" (click)="toggleCheck(item.id)">
            <div [class]="'chk' + (item.done ? ' done' : ' pending')">
              @if (item.done) {
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              }
            </div>
            {{ item.label }}
          </div>
        }
      </div>

      <div class="panel">
        <h3 class="panel-title">Similar Incidents</h3>
        @if (similar.length === 0) {
          <p class="similar-empty">No similar incidents in your assigned queue.</p>
        }
        @for (si of similar; track si.ref) {
          <div class="similar-item">
            <div class="similar-top">
              <span class="similar-id" (click)="openSimilar(si.ref)">{{ si.ref }}</span>
              @if (si.match > 0) {
                <span class="match-badge">{{ si.match }}% match</span>
              }
            </div>
            <div class="similar-desc">{{ si.title }}</div>
            <div class="similar-date">{{ si.date }}</div>
          </div>
        }
      </div>

    </div>
  </div>
</div>
`,
  styles: [`
    :host {
      --red:#e11d2e;
      --red-light:#fde2e4;
      --red-bg:#fef6f6;
      --orange:#f0a63a;
      --purple-a:#6d4ee0;
      --purple-b:#5a3fd0;
      --green:#22a35e;
      --green-bg:#eafaf1;
      --green-border:#bdeed3;
      --green-text:#178a4c;
      --ink:#1a1d29;
      --body:#4b5060;
      --muted:#8a8fa3;
      --border:#e7e9f0;
      --border-light:#eef0f5;
      --page-bg:#f5f6fa;
      --white:#FFFFFF;
      display:block;
    }

    .rca-page {
      background:var(--page-bg);
      color:var(--ink);
      font-size:14px;
      min-height:100%;
    }

    .rca-toast { padding:0.55rem 1rem; border-radius:8px; font-size:0.8rem; margin:0 24px 12px; }
    .rca-toast--ok  { background:var(--green-bg); color:var(--green-text); border:1px solid var(--green-border); }
    .rca-toast--err { background:#FEE2E2; color:#991b1b; border:1px solid #fecaca; }

    .rca-shell {
      display:grid;
      grid-template-columns:1fr 300px;
      align-items:start;
    }

    .main { padding:22px 24px; min-width:0; }

    .page-head {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      margin-bottom:18px;
    }
    .page-title h1 { margin:0 0 4px; font-size:20px; font-weight:700; }
    .page-title p { margin:0; font-size:13px; color:var(--muted); }
    .page-actions { display:flex; gap:10px; flex-shrink:0; }
    .btn {
      border-radius:6px;
      padding:9px 16px;
      font-size:13.5px;
      font-weight:600;
      cursor:pointer;
      border:1px solid transparent;
      font-family:inherit;
    }
    .btn:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-outline { background:var(--white); border-color:var(--border); color:var(--ink); }
    .btn-outline:hover:not(:disabled) { background:var(--page-bg); }
    .btn-solid { background:var(--red); color:#fff; }
    .btn-solid:hover:not(:disabled) { background:#C53030; }

    .method-tabs {
      display:grid;
      grid-template-columns:1fr 1fr 1fr;
      gap:14px;
      margin-bottom:18px;
    }
    .method-tab {
      border:1px solid var(--border);
      border-radius:8px;
      padding:14px 16px;
      background:var(--white);
      cursor:pointer;
      text-align:left;
      font-family:inherit;
    }
    .method-tab .t { font-weight:700; font-size:14px; margin-bottom:3px; color:var(--ink); }
    .method-tab .d { font-size:12px; color:var(--muted); }
    .method-tab.active {
      border:1.5px solid var(--red);
      background:var(--red-bg);
    }
    .method-tab.active .t { color:var(--red); }

    .card {
      background:var(--white);
      border:1px solid var(--border);
      border-radius:10px;
      padding:22px;
    }
    .card-title { font-size:15px; font-weight:700; margin:0 0 18px; }

    .why-row { display:flex; align-items:flex-start; gap:14px; margin-bottom:16px; }
    .why-badge {
      width:30px; height:30px; flex:none;
      border-radius:50%;
      color:#fff;
      font-size:12px;
      font-weight:700;
      display:flex; align-items:center; justify-content:center;
      margin-top:22px;
    }
    .why-badge--p { background:var(--red-light); color:var(--red); }
    .why-badge--w { background:var(--orange); }
    .why-badge--root { background:var(--green); color:#fff; }
    .why-body { flex:1; min-width:0; }
    .why-label { font-size:12px; color:var(--body); margin-bottom:6px; font-weight:500; }
    .why-label.root { color:var(--red); font-weight:700; }
    .field-row { display:flex; align-items:center; gap:8px; }
    .why-input {
      flex:1;
      border:1px solid var(--border);
      border-radius:7px;
      padding:10px 14px;
      font-size:13.5px;
      color:var(--ink);
      background:var(--white);
      outline:none;
      font-family:inherit;
      min-width:0;
    }
    .why-input::placeholder { color:var(--muted); }
    .why-input:focus {
      border-color:var(--red);
      box-shadow:0 0 0 3px rgba(229,62,62,.12);
    }
    .why-textarea { resize:vertical; min-height:64px; line-height:1.45; }
    .root-cause-edit { width:100%; background:rgba(255,255,255,.65); border-color:var(--green-border); margin-top:2px; }
    .field-icon {
      width:32px; height:32px; flex:none;
      display:flex; align-items:center; justify-content:center;
      color:var(--muted);
      border-radius:6px;
      cursor:pointer;
    }
    .field-icon:hover { background:var(--page-bg); color:var(--body); }

    .add-why {
      display:flex; align-items:center; gap:6px;
      color:var(--red);
      font-size:13px;
      font-weight:600;
      cursor:pointer;
      margin:4px 0 20px 44px;
      width:fit-content;
      background:none;
      border:none;
      font-family:inherit;
      padding:0;
    }
    .add-why:hover { opacity:0.85; }

    .root-cause-box {
      background:var(--green-bg);
      border:1px solid var(--green-border);
      border-radius:8px;
      padding:16px 18px;
    }
    .root-cause-label {
      color:var(--green-text);
      font-weight:700;
      font-size:11.5px;
      letter-spacing:.04em;
      text-transform:uppercase;
      margin-bottom:6px;
    }
    .root-cause-text { color:#065F46; font-size:13.5px; line-height:1.5; }

    .effect-pill-wrap { display:flex; justify-content:center; margin:0.25rem 0 1.25rem; }
    .effect-pill { background:var(--red); color:#fff; font-size:0.82rem; font-weight:600; padding:9px 28px; border-radius:8px; }
    .fishbone-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; }
    .fish-cat-card { border:1px solid var(--border); border-radius:9px; padding:0.85rem 1rem; background:var(--page-bg); }
    .fish-cat-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.55rem; }
    .fish-cat-title { font-size:0.82rem; font-weight:600; }
    .fish-cat-add { background:var(--white); border:1px solid var(--border); border-radius:6px; width:24px; height:24px;
      display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--body); }
    .fish-causes { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:5px; }
    .fish-cause-item { display:flex; align-items:flex-start; gap:7px; font-size:0.79rem; color:var(--body); line-height:1.4; }
    .fish-cause-remove { margin-left:auto; border:none; background:none; color:var(--muted); cursor:pointer; font-size:1rem; line-height:1; padding:0 2px; }
    .fish-cause-remove:hover { color:var(--red); }
    .fish-dot { width:6px; height:6px; border-radius:50%; background:var(--red); flex-shrink:0; margin-top:5px; }
    .fish-empty { font-size:0.78rem; color:var(--muted); margin:0; font-style:italic; }

    .str-field { margin-bottom:1rem; }
    .str-field--last { margin-bottom:0; }
    .str-field label { display:block; font-size:0.8rem; font-weight:500; color:var(--body); margin-bottom:6px; }
    .str-field select, .str-field textarea {
      width:100%; border:1px solid var(--border); border-radius:8px;
      padding:10px 12px; font-size:0.86rem; color:var(--ink);
      box-sizing:border-box; font-family:inherit;
    }
    .str-field textarea { resize:vertical; line-height:1.5; }

    .right-rail {
      padding:22px 20px 22px 0;
      display:flex;
      flex-direction:column;
      gap:16px;
    }
    .panel {
      background:var(--white);
      border:1px solid var(--border);
      border-radius:10px;
      padding:18px;
    }
    .panel-head {
      display:flex;
      align-items:center;
      gap:10px;
      margin-bottom:14px;
    }
    .panel-icon {
      width:32px; height:32px; border-radius:8px;
      background:linear-gradient(135deg,var(--purple-a),var(--purple-b));
      display:flex; align-items:center; justify-content:center;
      flex:none;
    }
    .panel-icon svg { width:16px; height:16px; stroke:#fff; fill:none; stroke-width:2; }
    .panel-head b { display:block; font-size:13.5px; font-weight:700; }
    .panel-head span { display:block; font-size:11.5px; color:var(--muted); }

    .ai-btn {
      width:100%;
      border:none;
      border-radius:7px;
      padding:11px;
      color:#fff;
      font-size:13.5px;
      font-weight:600;
      background:linear-gradient(135deg,var(--purple-a),var(--purple-b));
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      font-family:inherit;
    }
    .ai-btn svg { width:15px; height:15px; fill:#fff; stroke:none; }
    .ai-btn:hover { opacity:0.92; }

    .panel-title { font-size:14.5px; font-weight:700; margin:0 0 14px; }

    .checklist-item {
      display:flex;
      align-items:center;
      gap:10px;
      padding:8px 10px;
      border-bottom:1px solid var(--border-light);
      font-size:13px;
      color:var(--body);
      cursor:pointer;
      border-radius:6px;
      margin:0 -10px;
    }
    .checklist-item:last-child { border-bottom:none; }
    .checklist-item.done-text { color:var(--ink); }
    .checklist-item.done-row { background:var(--green-bg); border-bottom-color:transparent; }
    .checklist-item.done-row + .checklist-item { border-top:1px solid transparent; }
    .chk {
      width:16px; height:16px; flex:none;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
    }
    .chk.done { background:var(--green); }
    .chk.done svg { width:10px; height:10px; stroke:#fff; stroke-width:3; fill:none; }
    .chk.pending { border:2px solid var(--border); background:transparent; }

    .similar-item { padding:12px 0; border-bottom:1px solid var(--border-light); }
    .similar-item:last-child { border-bottom:none; padding-bottom:0; }
    .similar-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
    .similar-id { color:var(--red); font-weight:700; font-size:12.5px; cursor:pointer; }
    .match-badge {
      background:var(--green-bg);
      color:var(--green-text);
      font-size:11px;
      font-weight:700;
      padding:2px 8px;
      border-radius:999px;
    }
    .similar-desc { font-size:12.5px; color:var(--body); margin-bottom:2px; }
    .similar-date { font-size:11.5px; color:var(--muted); }
    .similar-empty { font-size:12px; color:var(--muted); margin:0 0 8px; }

    @media (max-width:1100px) {
      .rca-shell { grid-template-columns:1fr; }
      .right-rail { padding:0 24px 24px; }
      .method-tabs { grid-template-columns:1fr; }
      .fishbone-grid { grid-template-columns:1fr; }
    }
  `]
})
export class RcaComponent implements OnInit {
  incidentId = '';
  incidentRef = '';
  incidentTitle = '';
  currentCategory = '';
  activeMethod = signal<'5why' | 'fishbone' | 'structured'>('5why');
  saving = signal(false);
  generatingAi = signal(false);
  rcaSubmitted = signal(false);
  expandedFields = signal<Set<string>>(new Set());
  rootCauseManual = signal(false);
  toast = signal<{ type: 'ok' | 'err'; msg: string } | null>(null);

  problemStatement = '';
  rootCauseSummary = DEFAULT_SUMMARY;
  whys = signal<WhyEntry[]>([
    { id: '1', label: 'W1', text: '' },
  ]);

  fishboneCategories: FishboneCategory[] = [
    { key: 'man', label: 'Man', causes: [] },
    { key: 'machine', label: 'Machine', causes: [] },
    { key: 'method', label: 'Method', causes: [] },
    { key: 'material', label: 'Material', causes: [] },
    { key: 'env', label: 'Environment', causes: [] },
    { key: 'mgmt', label: 'Management', causes: [] },
  ];

  rootCauseCategories = ROOT_CAUSE_CATEGORIES;
  structuredData = { category: 'Equipment / Machine', description: '', contributing: '', verification: '', lessons: '' };
  checklist = signal(CHECKLIST_ITEMS.map(c => ({ ...c, done: false })));
  similar: SimilarIncident[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private rcaService: RcaService,
    private incidentService: IncidentService,
    private recentIncident: RecentIncidentService,
  ) {}

  ngOnInit(): void {
    this.incidentId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.incidentId && isGuid(this.incidentId)) {
      this.incidentService.getIncident(this.incidentId).subscribe({
        next: inc => {
          this.incidentRef = inc.incidentReference;
          this.incidentTitle = inc.shortDescription;
          this.currentCategory = inc.category;
          this.recentIncident.setLastViewed(inc.incidentReference);
          this.loadRca();
          this.loadSimilar();
        },
        error: () => this.loadRca(),
      });
    } else if (this.incidentId) {
      this.incidentRef = this.incidentId;
      this.incidentService.getIncident(this.incidentId).subscribe({
        next: inc => {
          this.incidentRef = inc.incidentReference;
          this.incidentTitle = inc.shortDescription;
          this.currentCategory = inc.category;
          this.recentIncident.setLastViewed(inc.incidentReference);
          this.incidentId = inc.id;
          this.loadRca();
          this.loadSimilar();
        },
        error: () => this.showToast('err', 'Incident not found.'),
      });
    }
  }

  private loadRca(): void {
    this.rcaService.getRca(this.incidentId).subscribe({
      next: dto => this.applyDto(dto),
      error: () => {},
    });
  }

  private loadSimilar(): void {
    if (!this.incidentId || !isGuid(this.incidentId)) return;
    this.rcaService.getSimilarIncidents(this.incidentId).subscribe({
      next: list => {
        this.similar = list.map(i => ({
          ref: i.incidentReference,
          title: i.title || i.category,
          date: new Date(i.createdAt).toISOString().slice(0, 10),
          match: i.matchPercent,
        }));
      },
      error: () => {
        this.incidentService.getAssignedIncidents().subscribe({
          next: list => {
            const cat = this.currentCategory.toLowerCase();
            this.similar = list
              .filter(i => i.id !== this.incidentId && i.incidentReference !== this.incidentRef)
              .map(i => ({
                ref: i.incidentReference,
                title: i.category,
                date: new Date(i.createdAt).toISOString().slice(0, 10),
                match: cat && i.category.toLowerCase() === cat ? 85 : i.category.toLowerCase().includes(cat.slice(0, 4)) ? 60 : 0,
              }))
              .filter(i => i.match > 0)
              .sort((a, b) => b.match - a.match)
              .slice(0, 5);
          },
          error: () => { this.similar = []; },
        });
      },
    });
  }

  toggleExpand(key: string): void {
    this.expandedFields.update(set => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  isExpanded(key: string): boolean {
    return this.expandedFields().has(key);
  }

  onRootCauseEdit(): void {
    this.rootCauseManual.set(true);
  }

  syncRootCause(): void {
    if (this.rootCauseManual()) return;

    if (this.activeMethod() === 'structured' && this.structuredData.description.trim()) {
      this.rootCauseSummary = this.structuredData.description.trim();
      return;
    }

    if (this.activeMethod() === '5why') {
      const last = [...this.whys()].reverse().find(w => w.text.trim());
      this.rootCauseSummary = last?.text.trim() ?? '';
      return;
    }

    if (this.activeMethod() === 'fishbone') {
      const causes = this.fishboneCategories.flatMap(c => c.causes).filter(Boolean);
      this.rootCauseSummary = causes.slice(0, 3).join('; ');
    }
  }

  openSimilar(ref: string): void {
    this.router.navigate(['/incidents', ref]);
  }

  tabClass(method: string): string {
    return 'method-tab' + (this.activeMethod() === method ? ' active' : '');
  }

  setMethod(m: '5why' | 'fishbone' | 'structured'): void {
    this.activeMethod.set(m);
    this.rootCauseManual.set(false);
    this.syncRootCause();
  }

  isRootWhy(index: number): boolean {
    return index === this.whys().length - 1 && this.whys().length >= 4;
  }

  showRemoveIcon(index: number): boolean {
    return index >= 1;
  }

  showChevronIcon(index: number): boolean {
    return !this.isRootWhy(index);
  }

  whyPlaceholder(index: number): string {
    if (this.isRootWhy(index)) {
      const prev = this.whys()[index - 1]?.text?.trim();
      if (prev) return `Why did "${prev}" happen?`;
    }
    return `Enter why ${index + 1}…`;
  }

  addWhy(): void {
    const n = this.whys().length + 1;
    this.whys.update(ws => [...ws, { id: `${n}-${Date.now()}`, label: `W${n}`, text: '' }]);
    this.syncRootCause();
  }

  removeWhy(id: string): void {
    if (this.whys().length <= 1) return;
    this.whys.update(ws => ws.filter(w => w.id !== id).map((w, i) => ({ ...w, label: `W${i + 1}` })));
    this.syncRootCause();
  }

  addCause(cat: FishboneCategory): void {
    const val = prompt(`Add a cause for "${cat.label}":`);
    if (val?.trim()) {
      cat.causes = [...cat.causes, val.trim()];
      this.syncRootCause();
    }
  }

  removeCause(cat: FishboneCategory, index: number): void {
    cat.causes = cat.causes.filter((_, i) => i !== index);
    this.syncRootCause();
  }

  toggleCheck(id: string): void {
    this.checklist.update(l => l.map(c => c.id === id ? { ...c, done: !c.done } : c));
  }

  generateRecommendations(): void {
    if (!this.incidentId || !isGuid(this.incidentId)) {
      this.showToast('err', 'Select an assigned incident first.');
      return;
    }
    this.generatingAi.set(true);
    this.rcaService.getRecommendations(this.incidentId).subscribe({
      next: rec => {
        this.problemStatement = rec.problemStatement;
        if (rec.whySuggestions.length) {
          this.whys.set(rec.whySuggestions.map((text, i) => ({
            id: `ai-${i + 1}`,
            label: `W${i + 1}`,
            text,
          })));
          this.activeMethod.set('5why');
        }
        this.structuredData.category = rec.structuredCategory;
        this.structuredData.description = rec.structuredDescription;
        this.applyFishboneDto(rec.fishboneSuggestions);
        this.checklist.update(list => list.map(c => ({
          ...c,
          done: c.done || rec.checklistToComplete.includes(c.id),
        })));
        this.rootCauseManual.set(false);
        this.syncRootCause();
        this.generatingAi.set(false);
        this.showToast('ok', 'AI recommendations applied. Review and save draft.');
      },
      error: () => {
        this.generatingAi.set(false);
        this.showToast('err', 'Could not generate recommendations.');
      },
    });
  }

  saveDraft(): void {
    if (!this.incidentId || !isGuid(this.incidentId)) {
      this.showToast('err', 'Select an assigned incident to save RCA.');
      return;
    }
    this.syncRootCause();
    this.saving.set(true);
    this.rcaService.saveRca(this.incidentId, this.buildPayload()).subscribe({
      next: () => { this.saving.set(false); this.showToast('ok', 'Draft saved.'); },
      error: err => {
        this.saving.set(false);
        this.showToast('err', err.error?.error ?? 'Failed to save draft.');
      },
    });
  }

  submitRca(): void {
    if (!this.incidentId || !isGuid(this.incidentId)) {
      this.showToast('err', 'Select an assigned incident to submit RCA.');
      return;
    }
    if (!this.problemStatement.trim()) {
      this.showToast('err', 'Problem statement is required.');
      this.activeMethod.set('5why');
      return;
    }
    this.syncRootCause();
    if (!this.rootCauseSummary.trim()) {
      this.showToast('err', 'Root cause is required. Complete the analysis or enter it in the green box.');
      return;
    }
    this.saving.set(true);
    this.rcaService.saveRca(this.incidentId, this.buildPayload()).subscribe({
      next: () => {
        this.rcaService.submitRca(this.incidentId).subscribe({
          next: () => {
            this.saving.set(false);
            this.rcaSubmitted.set(true);
            this.showToast('ok', 'RCA submitted successfully.');
          },
          error: err => {
            this.saving.set(false);
            this.showToast('err', err.error?.error ?? 'Submit failed.');
          },
        });
      },
      error: err => {
        this.saving.set(false);
        this.showToast('err', err.error?.error ?? 'Save before submit failed.');
      },
    });
  }

  private buildPayload() {
    const fb = this.fishboneCategories;
    return {
      method: this.activeMethod() === '5why' ? '5WHY' : this.activeMethod() === 'fishbone' ? 'FISHBONE' : 'STRUCTURED',
      problemStatement: this.problemStatement,
      whyEntries: this.whys().map((w, i) => ({ order: i + 1, text: w.text })),
      fishboneCategories: {
        man: fb.find(c => c.key === 'man')!.causes.join('\n'),
        machine: fb.find(c => c.key === 'machine')!.causes.join('\n'),
        method: fb.find(c => c.key === 'method')!.causes.join('\n'),
        material: fb.find(c => c.key === 'material')!.causes.join('\n'),
        environment: fb.find(c => c.key === 'env')!.causes.join('\n'),
        management: fb.find(c => c.key === 'mgmt')!.causes.join('\n'),
      },
      structuredCategory: this.structuredData.category,
      structuredDescription: this.structuredData.description,
      structuredContributing: this.structuredData.contributing,
      structuredVerification: this.structuredData.verification,
      structuredLessons: this.structuredData.lessons,
      rootCauseStatement: this.rootCauseSummary,
      checklistCompleted: this.checklist().filter(c => c.done).map(c => c.id),
    };
  }

  private applyDto(dto: import('./rca.service').RcaDto): void {
    this.incidentRef = dto.incidentReference;
    if (dto.problemStatement) {
      this.problemStatement = dto.problemStatement;
    }
    if (dto.rootCauseStatement) {
      this.rootCauseSummary = dto.rootCauseStatement;
      this.rootCauseManual.set(true);
    }
    if (dto.method === 'FISHBONE') this.activeMethod.set('fishbone');
    else if (dto.method === 'STRUCTURED') this.activeMethod.set('structured');
    else if (dto.method === '5WHY') this.activeMethod.set('5why');
    if (dto.whyEntries?.length) {
      this.whys.set(dto.whyEntries.map((w, i) => ({
        id: String(w.order), label: `W${i + 1}`, text: w.text,
      })));
    }
    if (dto.fishboneCategories) {
      this.applyFishboneDto(dto.fishboneCategories);
    }
    if (dto.structuredCategory) {
      this.structuredData.category = dto.structuredCategory;
    }
    if (dto.structuredDescription) {
      this.structuredData.description = dto.structuredDescription;
    }
    if (dto.structuredContributing) {
      this.structuredData.contributing = dto.structuredContributing;
    }
    if (dto.structuredVerification) {
      this.structuredData.verification = dto.structuredVerification;
    }
    if (dto.structuredLessons) {
      this.structuredData.lessons = dto.structuredLessons;
    }
    if (dto.checklistCompleted?.length) {
      this.checklist.update(list => list.map(c => ({
        ...c, done: dto.checklistCompleted.includes(c.id),
      })));
    }
    this.rcaSubmitted.set(dto.status === 'Submitted');
    this.syncRootCause();
  }

  private applyFishboneDto(fb: FishboneCategoriesDto): void {
    const split = (value: string) => value.split('\n').map(v => v.trim()).filter(Boolean);
    this.fishboneCategories = [
      { key: 'man', label: 'Man', causes: split(fb.man) },
      { key: 'machine', label: 'Machine', causes: split(fb.machine) },
      { key: 'method', label: 'Method', causes: split(fb.method) },
      { key: 'material', label: 'Material', causes: split(fb.material) },
      { key: 'env', label: 'Environment', causes: split(fb.environment) },
      { key: 'mgmt', label: 'Management', causes: split(fb.management) },
    ];
  }

  private showToast(type: 'ok' | 'err', msg: string): void {
    this.toast.set({ type, msg });
    setTimeout(() => this.toast.set(null), 3500);
  }
}

function isGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
