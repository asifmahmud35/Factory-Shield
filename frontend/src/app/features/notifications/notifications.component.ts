import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, NotificationDto } from './notification.service';

export interface NotificationView {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  unread: boolean;
  dotClass: string;
  deepLinkPath: string | null;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="notif-page">

  <div class="notif-hd">
    <div>
      <h1 class="notif-title">Notifications</h1>
      <p class="notif-sub">{{ unreadCount() }} unread notification{{ unreadCount() !== 1 ? 's' : '' }}</p>
    </div>
    @if (unreadCount() > 0) {
      <button type="button" class="mark-all-btn" (click)="markAllRead()" [disabled]="markingAll()">
        Mark all read
      </button>
    }
  </div>

  @if (loading()) {
    <div class="notif-empty">Loading notifications…</div>
  } @else if (error()) {
    <div class="notif-empty notif-empty--error">{{ error() }}</div>
  } @else if (items().length === 0) {
    <div class="notif-empty">No notifications yet.</div>
  } @else {
    <div class="notif-card">
      @for (n of items(); track n.id) {
        <div [class]="'notif-row' + (n.unread ? ' notif-row--unread' : '')"
          (click)="onRowClick(n)">
          <div [class]="'status-dot ' + n.dotClass"></div>
          <div class="notif-body">
            <div class="notif-title-row">
              <span class="notif-name">{{ n.title }}</span>
              @if (n.unread) {
                <span class="unread-dot"></span>
              }
            </div>
            <div class="notif-msg">{{ n.message }}</div>
            <div class="notif-time">{{ n.timeAgo }}</div>
          </div>
        </div>
      }
    </div>
  }

</div>
`,
  styles: [`
    :host {
      --red:#E53E3E;
      --ink:#1A202C;
      --body:#4A5568;
      --muted:#A0AEC0;
      --border:#E2E8F0;
      --border-light:#EDF2F7;
      --page-bg:#F7FAFC;
      --white:#FFFFFF;
      display:block;
    }

    .notif-page {
      padding:22px 24px;
      max-width:760px;
      font-family:inherit;
      background:var(--page-bg);
      min-height:100%;
    }

    .notif-hd {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      margin-bottom:18px;
      gap:1rem;
    }
    .notif-title { font-size:20px; font-weight:700; color:var(--ink); margin:0 0 4px; }
    .notif-sub { font-size:13px; color:var(--muted); margin:0; }
    .mark-all-btn {
      padding:8px 14px;
      font-size:13px;
      font-weight:500;
      background:var(--white);
      border:1px solid var(--border);
      border-radius:6px;
      cursor:pointer;
      color:var(--body);
      font-family:inherit;
      flex-shrink:0;
    }
    .mark-all-btn:hover:not(:disabled) { background:#F7FAFC; }
    .mark-all-btn:disabled { opacity:0.5; cursor:not-allowed; }

    .notif-empty {
      padding:2.5rem;
      text-align:center;
      color:var(--muted);
      font-size:13px;
      background:var(--white);
      border:1px solid var(--border);
      border-radius:12px;
    }
    .notif-empty--error { color:#C53030; background:#FFF5F5; border-color:#FEB2B2; }

    .notif-card {
      background:var(--white);
      border:1px solid var(--border);
      border-radius:12px;
      overflow:hidden;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
    }

    .notif-row {
      display:flex;
      align-items:flex-start;
      gap:14px;
      padding:16px 20px;
      border-bottom:1px solid var(--border-light);
      cursor:pointer;
      transition:background .12s;
    }
    .notif-row:last-child { border-bottom:none; }
    .notif-row:hover { background:#FAFAFA; }
    .notif-row--unread { background:var(--white); }

    .status-dot {
      width:10px;
      height:10px;
      border-radius:50%;
      flex-shrink:0;
      margin-top:6px;
    }
    .dot-red    { background:#E53E3E; }
    .dot-yellow { background:#D69E2E; }
    .dot-orange { background:#ED8936; }
    .dot-blue   { background:#3182CE; }
    .dot-gray   { background:#CBD5E0; }

    .notif-body { flex:1; min-width:0; }
    .notif-title-row {
      display:flex;
      align-items:center;
      gap:8px;
      margin-bottom:4px;
    }
    .notif-name { font-size:14px; font-weight:700; color:var(--ink); line-height:1.3; }
    .unread-dot {
      width:7px;
      height:7px;
      border-radius:50%;
      background:var(--red);
      flex-shrink:0;
    }
    .notif-msg {
      font-size:13px;
      color:var(--body);
      margin-bottom:6px;
      line-height:1.45;
    }
    .notif-time { font-size:12px; color:var(--muted); }
  `]
})
export class NotificationsComponent implements OnInit {
  items = signal<NotificationView[]>([]);
  unreadCount = signal(0);
  loading = signal(true);
  markingAll = signal(false);
  error = signal<string | null>(null);

  constructor(
    private svc: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getNotifications(false, 1, 50).subscribe({
      next: page => {
        this.items.set(page.items.map(mapNotification));
        this.unreadCount.set(page.unreadCount);
        this.svc.unreadCount.set(page.unreadCount);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load notifications.');
        this.loading.set(false);
      },
    });
  }

  onRowClick(n: NotificationView): void {
    if (n.unread) {
      this.markRead(n.id, false);
    }
    if (n.deepLinkPath) {
      this.router.navigateByUrl(n.deepLinkPath);
    }
  }

  markRead(id: string, reloadOnError = true): void {
    const item = this.items().find(n => n.id === id);
    if (!item?.unread) return;

    this.items.update(list =>
      list.map(n => n.id === id ? { ...n, unread: false } : n),
    );
    this.unreadCount.update(c => Math.max(0, c - 1));

    this.svc.markRead(id).subscribe({
      error: () => { if (reloadOnError) this.load(); },
    });
  }

  markAllRead(): void {
    this.markingAll.set(true);
    this.svc.markAllRead().subscribe({
      next: () => {
        this.items.update(list => list.map(n => ({ ...n, unread: false })));
        this.unreadCount.set(0);
        this.markingAll.set(false);
      },
      error: () => {
        this.markingAll.set(false);
        this.load();
      },
    });
  }
}

function mapNotification(dto: NotificationDto): NotificationView {
  const key = (dto.triggerEvent ?? dto.type ?? '').toUpperCase();
  const title = dto.subject?.trim() || formatTitle(key);
  const message = dto.body?.trim() || '';

  return {
    id: dto.id,
    title,
    message,
    timeAgo: timeAgo(dto.createdAt),
    unread: !dto.isRead,
    dotClass: dotClassFor(key, title, message),
    deepLinkPath: dto.deepLinkPath,
  };
}

function dotClassFor(key: string, title: string, message: string): string {
  const hay = `${key} ${title} ${message}`.toUpperCase();

  if (/CRITICAL|REPORTED|BREACH|SPILL|INCIDENT_REPORTED|SLA_BREACH|SLA_CRITICAL/.test(hay)) {
    return 'dot-red';
  }
  if (/APPROVAL|VERIFY|PENDING|ASSIGNMENT|APPROVAL_GATE/.test(hay)) {
    return 'dot-yellow';
  }
  if (/CAPA|OVERDUE|ESCALATION|SLA_WARNING|WARNING/.test(hay)) {
    return 'dot-orange';
  }
  if (/INVESTIGATION|CLOSED|RESOLVED|COMPLETED|INCIDENT_CLOSED/.test(hay)) {
    return 'dot-blue';
  }
  return 'dot-gray';
}

function formatTitle(key: string): string {
  const labels: Record<string, string> = {
    INCIDENT_CRITICAL: 'Critical Incident Reported',
    INCIDENT_REPORTED: 'Critical Incident Reported',
    SLA_BREACH: 'SLA Breached',
    SLA_CRITICAL: 'Critical SLA Alert',
    SLA_WARNING: 'SLA Warning',
    ESCALATION: 'Escalation Alert',
    ESCALATION_L2: 'Escalation Alert',
    ESCALATION_EXHAUSTED: 'Escalation Exhausted',
    APPROVAL_GATE: 'Approval Required',
    APPROVAL_REQUIRED: 'Approval Required',
    ASSIGNMENT: 'Assignment Notification',
    CAPA_OVERDUE: 'CAPA Overdue',
    INVESTIGATION: 'Investigation Completed',
    INCIDENT_CLOSED: 'Incident Closed',
  };
  if (labels[key]) return labels[key];
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? '1d ago' : `${days}d ago`;
}
