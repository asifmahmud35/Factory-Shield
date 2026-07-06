import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApprovalsService, PendingApproval, SubmitApprovalResult } from './approvals.service';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="apr-page">

  @if (toast()) {
    <div [class]="'apr-toast apr-toast--' + toast()!.type">{{ toast()!.msg }}</div>
  }

  <div class="apr-hd">
    <div>
      <h1 class="apr-title">Pending Approvals</h1>
      <p class="apr-sub">
        @if (accessDenied() || loading() || error()) {
          Dual-control approval gates awaiting your decision
        } @else {
          {{ items().length }} {{ items().length === 1 ? 'item' : 'items' }} awaiting your approval
        }
      </p>
    </div>
  </div>

  @if (accessDenied()) {
    <div class="apr-state apr-state--card">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div class="apr-denied-title">Approver or Governance access required</div>
      <p class="apr-denied-text">
        Approval gates are available to Approvers, Managers, and Compliance roles.
        You're signed in as a different role, so pending approvals can't be shown here.
      </p>
    </div>
  } @else if (loading()) {
    <div class="apr-state">Loading pending approvals…</div>
  } @else if (error()) {
    <div class="apr-state apr-state--err">{{ error() }}</div>
  } @else if (items().length === 0) {
    <div class="apr-state apr-state--card">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#22c55e"
        stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <div class="apr-denied-title">Nothing awaiting approval</div>
      <p class="apr-denied-text">There are no incidents sitting at an approval gate right now.</p>
    </div>
  } @else {

    <div class="apr-list">
      @for (a of items(); track a.incidentId) {
        <div class="apr-card">
          <button type="button" class="apr-view" (click)="viewDetails(a)">View Details</button>

          <div class="apr-card-tags">
            <span class="apr-ref">{{ a.incidentReference }}</span>
            <span [class]="'apr-sev ' + sevCls(a.severityLabel)">{{ a.severityLabel }}</span>
            @if (isUrgent(a)) {
              <span class="apr-urgent">Urgent</span>
            }
            @if (a.approveVotes > 0) {
              <span class="apr-votes">{{ a.approveVotes }}/{{ a.requiredApprovals }} approvals — yours completes the gate</span>
            }
          </div>

          <div class="apr-card-title">{{ a.approvalTitle }}</div>
          <div class="apr-card-desc">{{ a.title }}</div>
          <div class="apr-card-meta">
            Submitted by {{ a.submittedBy ?? 'Anonymous' }} · {{ a.submittedAt | date:'yyyy-MM-dd HH:mm' }}
          </div>

          <div class="apr-actions">
            <button type="button" class="apr-btn apr-btn--approve"
              [disabled]="busyId() === a.incidentId" (click)="approve(a)">Approve</button>
            <button type="button" class="apr-btn apr-btn--reject"
              [disabled]="busyId() === a.incidentId" (click)="reject(a)">Reject</button>
            <button type="button" class="apr-btn apr-btn--revision"
              [disabled]="busyId() === a.incidentId" (click)="requestRevision(a)">Request Revision</button>
          </div>
        </div>
      }
    </div>

  }
</div>
`,
  styles: [`
    .apr-page { padding:22px 26px; max-width:1280px; margin:0 auto; font-family:inherit; }

    .apr-toast { padding:10px 16px; border-radius:8px; font-size:13px; margin-bottom:16px; }
    .apr-toast--ok  { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }
    .apr-toast--err { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }

    .apr-hd { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:22px; }
    .apr-title { font-size:24px; font-weight:700; color:#111827; margin:0 0 5px; }
    .apr-sub { font-size:13.5px; color:#6b7280; margin:0; }

    .apr-state { padding:28px; text-align:center; font-size:14px; color:#9ca3af; }
    .apr-state--err { color:#991b1b; }
    .apr-state--card {
      background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:48px 24px;
      display:flex; flex-direction:column; align-items:center; gap:10px;
    }
    .apr-state--card svg { color:#cbd5e1; }
    .apr-denied-title { font-size:15px; font-weight:700; color:#111827; }
    .apr-denied-text { font-size:13px; color:#4b5563; max-width:460px; line-height:1.6; margin:0; }

    .apr-list { display:flex; flex-direction:column; gap:18px; }
    .apr-card {
      position:relative; background:#fff; border:1px solid #e5e7eb;
      border-radius:12px; padding:20px 22px;
    }
    .apr-view {
      position:absolute; top:20px; right:22px;
      background:#fff; border:1px solid #fecaca; border-radius:999px;
      padding:7px 16px; font-size:12.5px; font-weight:600; color:#dc2626;
      cursor:pointer; font-family:inherit;
    }
    .apr-view:hover { background:#fef2f2; }

    .apr-card-tags { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .apr-ref { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; font-weight:700; color:#dc2626; letter-spacing:.02em; }
    .apr-sev { font-size:11px; font-weight:700; padding:2px 9px; border-radius:999px; }
    .apr-sev--critical { background:#fef2f2; color:#dc2626; }
    .apr-sev--high     { background:#fff7ed; color:#c2410c; }
    .apr-sev--medium   { background:#fffbeb; color:#b45309; }
    .apr-sev--low      { background:#f0fdf4; color:#16a34a; }
    .apr-sev--unknown  { background:#f3f4f6; color:#6b7280; }
    .apr-urgent {
      font-size:11px; font-weight:700; padding:2px 9px; border-radius:999px;
      background:#fff; color:#dc2626; border:1px solid #fecaca;
    }
    .apr-votes {
      font-size:11px; font-weight:600; padding:2px 9px; border-radius:999px;
      background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;
    }

    .apr-card-title { font-size:17px; font-weight:700; color:#111827; margin-bottom:4px; }
    .apr-card-desc { font-size:14px; color:#6b7280; margin-bottom:6px; }
    .apr-card-meta { font-size:12.5px; color:#9ca3af; margin-bottom:18px; }

    .apr-actions { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
    .apr-btn {
      padding:13px 16px; border-radius:9px; font-size:14px; font-weight:600;
      cursor:pointer; font-family:inherit; border:1.5px solid transparent; transition:background .12s;
    }
    .apr-btn:disabled { opacity:.55; cursor:not-allowed; }
    .apr-btn--approve { background:#16a34a; color:#fff; border-color:#16a34a; }
    .apr-btn--approve:hover:not(:disabled) { background:#15803d; }
    .apr-btn--reject { background:#fff; color:#374151; border-color:#e5e7eb; }
    .apr-btn--reject:hover:not(:disabled) { background:#f9fafb; }
    .apr-btn--revision { background:#fff; color:#c2410c; border-color:#fde68a; }
    .apr-btn--revision:hover:not(:disabled) { background:#fffbeb; }

    @media (max-width:640px) {
      .apr-actions { grid-template-columns:1fr; }
      .apr-view { position:static; margin-bottom:10px; }
    }
  `]
})
export class ApprovalsComponent implements OnInit {
  private service = inject(ApprovalsService);
  private router = inject(Router);

  items = signal<PendingApproval[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  accessDenied = signal(false);
  busyId = signal<string | null>(null);
  toast = signal<{ type: 'ok' | 'err'; msg: string } | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.accessDenied.set(false);
    this.service.getPending().subscribe({
      next: rows => { this.items.set(rows); this.loading.set(false); },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) this.accessDenied.set(true);
        else this.error.set('Failed to load pending approvals.');
      },
    });
  }

  approve(a: PendingApproval): void {
    this.submit(a, true, null, result =>
      result.gateCompleted
        ? `${a.incidentReference} — ${a.approvalTitle} approved. Incident advanced to ${result.newStatus}.`
        : `${a.incidentReference} — your approval was recorded (${result.approveVotes}/${result.requiredApprovals}). Waiting for a second approver.`);
  }

  reject(a: PendingApproval): void {
    const reason = prompt(`Reason for rejecting "${a.approvalTitle}" (required):`);
    if (!reason?.trim()) return;
    this.submit(a, false, reason.trim(), () => `${a.incidentReference} — ${a.approvalTitle} rejected.`);
  }

  requestRevision(a: PendingApproval): void {
    const note = prompt(`What revision is required for "${a.approvalTitle}"?`);
    if (!note?.trim()) return;
    this.submit(a, false, `Revision requested: ${note.trim()}`, () => 'Revision requested.');
  }

  private submit(
    a: PendingApproval,
    isApprove: boolean,
    rejectionReason: string | null,
    okMsg: (result: SubmitApprovalResult) => string,
  ): void {
    this.busyId.set(a.incidentId);
    this.service.submit(a.incidentId, { approvalType: a.approvalType, isApprove, rejectionReason }).subscribe({
      next: result => { this.busyId.set(null); this.showToast('ok', okMsg(result)); this.load(); },
      error: (err: HttpErrorResponse) => {
        this.busyId.set(null);
        const msg = err.error?.error ?? 'Action failed.';
        this.showToast('err', msg);
      },
    });
  }

  viewDetails(a: PendingApproval): void {
    this.router.navigate(['/incidents', a.incidentId]);
  }

  sevCls(label: string): string {
    return 'apr-sev--' + (label ?? 'unknown').toLowerCase();
  }

  isUrgent(a: PendingApproval): boolean {
    return (a.severityLabel ?? '').toLowerCase() === 'critical';
  }

  private showToast(type: 'ok' | 'err', msg: string): void {
    this.toast.set({ type, msg });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
