import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EscalationService } from './escalation.service';

export interface ActiveEscalation {
  id: string;
  incidentId: string;
  ref: string;
  severity: string;
  title: string;
  escalatedTo: string;
  day: number;
  progress: number;
  slaLabel: string;
  slaOverdue: boolean;
}

export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  triggerAfterMinutes: number;
  triggerTime: string;
  channels: string[];
  recipients: string[];
  active: boolean;
}

export interface NotifItem {
  id: string;
  ref: string;
  title: string;
  via: string;
  recipients: string;
  timestamp: string;
  status: 'Delivered' | 'Acknowledged' | 'Failed' | 'Pending';
}

function formatMinutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)} hour${hours === 1 ? '' : 's'}`;
}

function parseTriggerTimeToMinutes(label: string): number {
  const m = label.match(/(\d+)\s*hour/);
  if (m) return parseInt(m[1], 10) * 60;
  const mins = label.match(/(\d+)\s*minute/);
  if (mins) return parseInt(mins[1], 10);
  return 120;
}

function formatSlaLabel(remainingMinutes: number, overdue: boolean): string {
  if (overdue) return 'Overdue';
  const h = Math.floor(remainingMinutes / 60);
  const m = Math.round(remainingMinutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function progressBarClass(progress: number, overdue: boolean): string {
  if (overdue || progress >= 100) return 'fill-red';
  if (progress >= 80) return 'fill-amber';
  return 'fill-green';
}

@Component({
  selector: 'app-escalation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="esc-page">

  <div class="esc-hd">
    <div>
      <h1 class="esc-title">Escalation Management</h1>
      <p class="esc-sub">Configure rules, monitor active escalations, and review notification history</p>
    </div>
    @if (!accessDenied()) {
      <button type="button" class="btn-new-rule" (click)="showRuleForm.set(true)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Rule
      </button>
    }
  </div>

  @if (accessDenied()) {
    <div class="esc-denied">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div class="esc-denied-title">Approver or Admin access required</div>
      <p class="esc-denied-text">
        Escalation Management is available to Approvers and Administrators.
        You're signed in as a different role, so escalation data can't be shown here.
      </p>
    </div>
  } @else {

  @if (error()) {
    <div class="esc-alert">{{ error() }}</div>
  }

  <!-- Active Escalations -->
  <section class="esc-section">
    <h2 class="section-title">Active Escalations</h2>

    @if (loading() && activeEscalations().length === 0) {
      <div class="esc-empty">Loading active escalations…</div>
    } @else if (activeEscalations().length === 0) {
      <div class="esc-empty">No active escalations right now.</div>
    } @else {
      <div class="active-grid">
        @for (esc of activeEscalations(); track esc.id) {
          <div class="active-card">
            <div class="active-card-top">
              <div class="active-card-main">
                <div class="active-tags">
                  <span [class]="'sev-badge ' + sevCls(esc.severity)">{{ esc.severity }}</span>
                  <span class="active-ref">{{ esc.ref }}</span>
                </div>
                <div class="active-title">{{ esc.title }}</div>
                <div class="active-esc-to">
                  Escalated to <strong>{{ esc.escalatedTo }}</strong>
                </div>
              </div>
              <button type="button" class="view-link" (click)="viewIncident(esc)">
                <span>&rsaquo;</span> View
              </button>
            </div>

            <div class="active-prog-row">
              <div class="active-prog-track">
                <div class="active-prog-fill"
                  [style.width.%]="esc.progress"
                  [class]="progressBarClass(esc.progress, esc.slaOverdue)">
                </div>
              </div>
              <span class="active-prog-pct">{{ esc.progress }}%</span>
              <span [class]="'active-sla ' + (esc.slaOverdue ? 'active-sla--overdue' : '')">
                {{ esc.slaLabel }}
              </span>
            </div>
          </div>
        }
      </div>
    }
  </section>

  <!-- Rules + Notification History -->
  <div class="two-col">

    <section>
      <h2 class="section-title">Escalation Rules</h2>

      @if (showRuleForm()) {
        <div class="rule-form-card">
          <div class="rule-form-title">New Escalation Rule</div>
          <div class="rf-row">
            <div class="rf-field">
              <label>Rule Name *</label>
              <input type="text" [(ngModel)]="newRule.name" placeholder="Rule name…">
            </div>
            <div class="rf-field">
              <label>Trigger After</label>
              <select [(ngModel)]="newRule.triggerTime">
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
                <option>4 hours</option>
                <option>24 hours</option>
              </select>
            </div>
          </div>
          <div class="rf-field">
            <label>Description</label>
            <textarea rows="2" [(ngModel)]="newRule.description"
              placeholder="Describe when this rule fires…"></textarea>
          </div>
          <div class="rf-row">
            <div class="rf-field">
              <label>Recipients (comma-separated)</label>
              <input type="text" [(ngModel)]="newRule.recipientsRaw"
                placeholder="Supervisor, Factory Manager…">
            </div>
            <div class="rf-field">
              <label>Channels (comma-separated)</label>
              <input type="text" [(ngModel)]="newRule.channelsRaw"
                placeholder="Email, SMS, Push…">
            </div>
          </div>
          <div class="rf-actions">
            <button type="button" class="btn-cancel" (click)="showRuleForm.set(false)">Cancel</button>
            <button type="button" class="btn-save" [disabled]="!newRule.name.trim()" (click)="addRule()">
              Add Rule
            </button>
          </div>
        </div>
      }

      <div class="rules-list">
        @for (rule of rules(); track rule.id) {
          <div class="rule-card">
            <div class="rule-hd">
              <div class="rule-name-row">
                <span class="rule-name">{{ rule.name }}</span>
                @if (rule.active) {
                  <span class="rule-badge rule-badge--active">Active</span>
                } @else {
                  <span class="rule-badge rule-badge--disabled">Disabled</span>
                }
              </div>
              <div class="toggle-wrap" (click)="toggleRule(rule)">
                <div [class]="'toggle ' + (rule.active ? 'toggle--on' : '')">
                  <div class="toggle-knob"></div>
                </div>
              </div>
            </div>

            <p class="rule-desc">{{ rule.description }}</p>

            <div class="rule-meta-row">
              <div class="rule-chips">
                <span class="chip chip--time">{{ rule.triggerTime }}</span>
                @for (ch of rule.channels; track ch) {
                  <span class="chip chip--ch">{{ ch }}</span>
                }
              </div>
              <div class="rule-recipients">
                @for (r of rule.recipients; track r) {
                  <span [class]="'recipient-pill ' + recipientCls(r)">{{ r }}</span>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </section>

    <section>
      <h2 class="section-title">Notification History</h2>

      <div class="notif-panel">
        @if (notifications().length === 0 && !loading()) {
          <div class="notif-empty">No notifications yet.</div>
        }
        @for (n of notifications(); track n.id) {
          <div class="notif-row">
            <div class="notif-body">
              <div class="notif-top">
                <span class="notif-ref">{{ n.ref }}</span>
                <span [class]="'notif-status ' + notifStatusCls(n.status)">{{ n.status }}</span>
              </div>
              <div class="notif-rule">{{ n.title }}</div>
              <div class="notif-recipients">{{ n.recipients }}</div>
              <div class="notif-via">{{ n.via }}</div>
            </div>
            <div class="notif-ts">{{ n.timestamp | date:'MMM d, HH:mm' }}</div>
          </div>
        }
      </div>
    </section>

  </div>

  }
</div>
`,
  styles: [`
    :host {
      --red:#E53E3E;
      --red-bg:#FFF5F5;
      --ink:#1A202C;
      --body:#4A5568;
      --muted:#A0AEC0;
      --border:#E2E8F0;
      --border-light:#EDF2F7;
      --page-bg:#F7FAFC;
      --white:#FFFFFF;
      --green:#10B981;
      display:block;
    }

    .esc-page {
      padding:22px 24px;
      max-width:1320px;
      margin:0 auto;
      font-family:inherit;
      background:var(--page-bg);
      min-height:100%;
    }

    .esc-hd {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:1rem;
      margin-bottom:22px;
    }
    .esc-title { font-size:20px; font-weight:700; color:var(--ink); margin:0 0 4px; }
    .esc-sub { font-size:13px; color:var(--muted); margin:0; }
    .btn-new-rule {
      display:flex; align-items:center; gap:6px;
      padding:9px 16px; font-size:13.5px; font-weight:600;
      background:var(--red); border:none; border-radius:6px;
      cursor:pointer; color:#fff; white-space:nowrap; flex-shrink:0;
      font-family:inherit;
    }
    .btn-new-rule:hover { background:#C53030; }

    .esc-denied {
      background:var(--white); border:1px solid var(--border); border-radius:12px;
      padding:48px 24px; text-align:center; color:var(--muted);
      display:flex; flex-direction:column; align-items:center; gap:10px;
    }
    .esc-denied svg { color:#CBD5E0; }
    .esc-denied-title { font-size:15px; font-weight:700; color:var(--ink); }
    .esc-denied-text { font-size:13px; color:var(--body); max-width:440px; line-height:1.6; margin:0; }

    .esc-alert {
      padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:16px;
      background:#FEE2E2; color:#991b1b; border:1px solid #fecaca;
    }
    .esc-empty, .notif-empty {
      padding:2rem; text-align:center; font-size:13px; color:var(--muted);
      background:var(--white); border:1px solid var(--border); border-radius:10px;
    }

    .section-title { font-size:15px; font-weight:700; color:var(--ink); margin:0 0 14px; }
    .esc-section { margin-bottom:24px; }

    /* Active cards — horizontal grid */
    .active-grid {
      display:grid;
      grid-template-columns:repeat(3, 1fr);
      gap:14px;
    }
    .active-card {
      background:var(--white);
      border:1px solid var(--border);
      border-radius:10px;
      padding:16px 18px;
      display:flex;
      flex-direction:column;
      gap:14px;
      min-width:0;
    }
    .active-card-top {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:10px;
    }
    .active-card-main { flex:1; min-width:0; }
    .active-tags { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
    .sev-badge { font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; }
    .sev-critical { background:#FEE2E2; color:#C53030; }
    .sev-high { background:#FFEDD5; color:#C05621; }
    .sev-medium { background:#FEF9C3; color:#B45309; }
    .active-ref { font-size:12px; font-weight:700; color:var(--red); }
    .active-title { font-size:14px; font-weight:700; color:var(--ink); line-height:1.35; margin-bottom:4px; }
    .active-esc-to { font-size:12px; color:var(--muted); }
    .active-esc-to strong { color:var(--body); font-weight:600; }

    .view-link {
      background:none; border:none; cursor:pointer;
      font-size:13px; font-weight:600; color:var(--body);
      display:flex; align-items:center; gap:2px; flex-shrink:0;
      padding:4px 0; font-family:inherit;
    }
    .view-link span { font-size:18px; line-height:1; color:var(--muted); }
    .view-link:hover { color:var(--red); }
    .view-link:hover span { color:var(--red); }

    .active-prog-row {
      display:flex; align-items:center; gap:10px;
    }
    .active-prog-track {
      flex:1; height:6px; background:var(--border-light);
      border-radius:999px; overflow:hidden; min-width:0;
    }
    .active-prog-fill { height:100%; border-radius:999px; transition:width .3s; }
    .fill-green { background:var(--green); }
    .fill-amber { background:#F59E0B; }
    .fill-red { background:var(--red); }
    .active-prog-pct { font-size:12px; font-weight:700; color:var(--body); width:34px; text-align:right; flex-shrink:0; }
    .active-sla { font-size:12px; font-weight:600; color:var(--body); white-space:nowrap; flex-shrink:0; }
    .active-sla--overdue { color:var(--red); font-weight:700; }

    /* Two column */
    .two-col {
      display:grid;
      grid-template-columns:minmax(0, 1.55fr) minmax(280px, 1fr);
      gap:20px;
      align-items:start;
    }

    /* Rule form */
    .rule-form-card {
      background:var(--white); border:1px solid var(--border);
      border-radius:10px; padding:16px 18px; margin-bottom:12px;
    }
    .rule-form-title { font-size:14px; font-weight:700; margin-bottom:12px; }
    .rf-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .rf-field { margin-bottom:12px; }
    .rf-field label {
      display:block; font-size:11px; font-weight:600; color:var(--body);
      text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px;
    }
    .rf-field input, .rf-field select, .rf-field textarea {
      width:100%; border:1px solid var(--border); border-radius:7px;
      padding:9px 12px; font-size:13.5px; color:var(--ink);
      box-sizing:border-box; background:var(--white); font-family:inherit;
    }
    .rf-field textarea { resize:vertical; }
    .rf-actions { display:flex; gap:8px; justify-content:flex-end; }
    .btn-cancel {
      background:none; border:1px solid var(--border); border-radius:6px;
      padding:8px 14px; font-size:13px; cursor:pointer; color:var(--body); font-family:inherit;
    }
    .btn-save {
      background:var(--red); color:#fff; border:none; border-radius:6px;
      padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit;
    }
    .btn-save:disabled { opacity:.45; cursor:not-allowed; }

    /* Rules */
    .rules-list { display:flex; flex-direction:column; gap:12px; }
    .rule-card {
      background:var(--white); border:1px solid var(--border);
      border-radius:10px; padding:16px 18px;
    }
    .rule-hd {
      display:flex; align-items:flex-start; justify-content:space-between;
      gap:12px; margin-bottom:6px;
    }
    .rule-name-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .rule-name { font-size:14px; font-weight:700; color:var(--ink); }
    .rule-badge { font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; }
    .rule-badge--active { background:#ECFDF5; color:#059669; }
    .rule-badge--disabled { background:#F3F4F6; color:#6B7280; }
    .rule-desc { font-size:13px; color:var(--body); line-height:1.55; margin:0 0 12px; }

    .toggle-wrap { cursor:pointer; flex-shrink:0; }
    .toggle {
      width:40px; height:22px; border-radius:11px;
      background:#CBD5E0; position:relative; transition:background .2s;
    }
    .toggle--on { background:var(--green); }
    .toggle-knob {
      width:18px; height:18px; background:#fff; border-radius:50%;
      position:absolute; top:2px; left:2px; transition:transform .2s;
      box-shadow:0 1px 3px rgba(0,0,0,.15);
    }
    .toggle--on .toggle-knob { transform:translateX(18px); }

    .rule-meta-row {
      display:flex; align-items:flex-start; justify-content:space-between;
      gap:8px; flex-wrap:wrap;
    }
    .rule-chips { display:flex; gap:6px; flex-wrap:wrap; }
    .chip { font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:6px; }
    .chip--time { background:#EBF8FF; color:#2B6CB0; }
    .chip--ch { background:#F7FAFC; color:var(--body); border:1px solid var(--border-light); }
    .rule-recipients { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
    .recipient-pill { font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:6px; }
    .pill-purple { background:#FAF5FF; color:#6B46C1; }
    .pill-blue { background:#EBF8FF; color:#2B6CB0; }
    .pill-green { background:#F0FFF4; color:#276749; }
    .pill-amber { background:#FFFAF0; color:#C05621; }
    .pill-gray { background:#F7FAFC; color:var(--body); }

    /* Notifications */
    .notif-panel {
      background:var(--white); border:1px solid var(--border);
      border-radius:10px; overflow:hidden;
    }
    .notif-row {
      display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
      padding:14px 16px; border-bottom:1px solid var(--border-light);
    }
    .notif-row:last-child { border-bottom:none; }
    .notif-body { flex:1; min-width:0; }
    .notif-top { display:flex; align-items:center; gap:8px; margin-bottom:3px; flex-wrap:wrap; }
    .notif-ref { font-size:12px; font-weight:700; color:var(--red); }
    .notif-status { font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:999px; }
    .ns-delivered { background:#ECFDF5; color:#059669; }
    .ns-acknowledged { background:#EBF8FF; color:#2B6CB0; }
    .ns-failed { background:#FEE2E2; color:#C53030; }
    .ns-pending { background:#F7FAFC; color:var(--body); }
    .notif-rule { font-size:13px; font-weight:600; color:var(--ink); margin-bottom:2px; }
    .notif-recipients { font-size:12px; color:var(--body); margin-bottom:2px; }
    .notif-via { font-size:11.5px; color:var(--muted); }
    .notif-ts { font-size:11px; color:var(--muted); white-space:nowrap; flex-shrink:0; padding-top:2px; }

    @media (max-width:1100px) {
      .active-grid { grid-template-columns:1fr; }
      .two-col { grid-template-columns:1fr; }
      .rf-row { grid-template-columns:1fr; }
    }
    @media (max-width:700px) {
      .active-grid { grid-template-columns:1fr; }
    }
  `]
})
export class EscalationComponent implements OnInit {
  private escalationService = inject(EscalationService);
  private router = inject(Router);

  activeEscalations = signal<ActiveEscalation[]>([]);
  rules = signal<EscalationRule[]>([]);
  notifications = signal<NotifItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  accessDenied = signal(false);
  showRuleForm = signal(false);

  newRule = { name: '', description: '', triggerTime: '2 hours', recipientsRaw: '', channelsRaw: '' };

  progressBarClass = progressBarClass;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);
    this.accessDenied.set(false);

    // Three independent calls; clear the spinner once all three settle
    // (success OR error), so a 403 never leaves the page stuck on "Loading…".
    let pending = 3;
    const settle = () => { if (--pending === 0) this.loading.set(false); };
    const onError = (err: HttpErrorResponse, msg: string) => {
      if (err.status === 401 || err.status === 403) this.accessDenied.set(true);
      else this.error.set(msg);
      settle();
    };

    this.escalationService.getActive().subscribe({
      next: rows => {
        this.activeEscalations.set(rows.map(r => ({
          id: r.id,
          incidentId: r.incidentId,
          ref: r.incidentReference,
          severity: r.severity,
          title: r.title,
          escalatedTo: r.escalatedTo,
          day: r.day,
          progress: r.progressPct,
          slaLabel: formatSlaLabel(r.slaRemainingMinutes, r.slaOverdue),
          slaOverdue: r.slaOverdue,
        })));
        settle();
      },
      error: err => onError(err, 'Failed to load active escalations.'),
    });

    this.escalationService.getRules().subscribe({
      next: rows => {
        this.rules.set(rows.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          triggerAfterMinutes: r.triggerAfterMinutes,
          triggerTime: formatMinutesLabel(r.triggerAfterMinutes),
          channels: r.channels,
          recipients: r.recipients,
          active: r.active,
        })));
        settle();
      },
      error: err => onError(err, 'Failed to load escalation rules.'),
    });

    this.escalationService.getNotifications().subscribe({
      next: rows => {
        this.notifications.set(rows.map(n => ({
          id: n.id,
          ref: n.incidentReference,
          title: n.ruleName,
          via: n.via,
          recipients: n.recipients,
          timestamp: n.sentAt,
          status: (['Delivered', 'Acknowledged', 'Failed', 'Pending'].includes(n.status)
            ? n.status : 'Pending') as NotifItem['status'],
        })));
        settle();
      },
      error: err => onError(err, 'Failed to load notification history.'),
    });
  }

  viewIncident(esc: ActiveEscalation): void {
    if (esc.incidentId) {
      this.router.navigate(['/incidents', esc.incidentId]);
    } else {
      this.router.navigate(['/incidents', esc.ref]);
    }
  }

  addRule(): void {
    if (!this.newRule.name.trim()) return;
    const body = {
      name: this.newRule.name.trim(),
      description: this.newRule.description.trim(),
      triggerAfterMinutes: parseTriggerTimeToMinutes(this.newRule.triggerTime),
      recipients: this.newRule.recipientsRaw.split(',').map(s => s.trim()).filter(Boolean),
      channels: this.newRule.channelsRaw.split(',').map(s => s.trim()).filter(Boolean),
      active: true,
    };
    this.escalationService.createRule(body).subscribe({
      next: created => {
        this.rules.update(list => [...list, {
          id: created.id,
          name: created.name,
          description: body.description,
          triggerAfterMinutes: body.triggerAfterMinutes,
          triggerTime: formatMinutesLabel(body.triggerAfterMinutes),
          channels: body.channels,
          recipients: body.recipients,
          active: true,
        }]);
        this.newRule = { name: '', description: '', triggerTime: '2 hours', recipientsRaw: '', channelsRaw: '' };
        this.showRuleForm.set(false);
      },
      error: () => this.error.set('Failed to create escalation rule.'),
    });
  }

  toggleRule(rule: EscalationRule): void {
    const nextActive = !rule.active;
    this.escalationService.updateRule(rule.id, { active: nextActive }).subscribe({
      next: () => this.rules.update(list =>
        list.map(r => r.id === rule.id ? { ...r, active: nextActive } : r)),
      error: () => this.error.set('Failed to update escalation rule.'),
    });
  }

  sevCls(s: string): string {
    const lower = s.toLowerCase();
    if (lower === 'critical') return 'sev-critical';
    if (lower === 'high') return 'sev-high';
    return 'sev-medium';
  }

  recipientCls(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('manager') || n.includes('hq')) return 'pill-purple';
    if (n.includes('supervisor')) return 'pill-blue';
    if (n.includes('hse') || n.includes('safety')) return 'pill-green';
    if (n.includes('hr') || n.includes('training')) return 'pill-amber';
    return 'pill-gray';
  }

  notifStatusCls(s: string): string {
    const m: Record<string, string> = {
      Delivered: 'notif-status ns-delivered',
      Acknowledged: 'notif-status ns-acknowledged',
      Failed: 'notif-status ns-failed',
      Pending: 'notif-status ns-pending',
    };
    return m[s] ?? 'notif-status ns-pending';
  }
}
