import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineSyncService } from '../../features/incidents/offline-sync.service';

@Component({
  selector: 'app-sync-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!isOnline()) {
      <span class="badge badge-offline" (click)="trySync()" title="Click to retry sync">
        <span class="dot dot-amber"></span>
        Offline{{ pendingCount() > 0 ? ' — ' + pendingCount() + ' draft' + (pendingCount() === 1 ? '' : 's') + ' pending' : '' }}
      </span>
    } @else if (pendingCount() > 0) {
      <span class="badge badge-syncing" (click)="trySync()" title="Click to sync now">
        <span class="dot dot-amber dot-pulse"></span>
        {{ syncing() ? 'Syncing…' : pendingCount() + ' draft' + (pendingCount() === 1 ? '' : 's') + ' pending' }}
      </span>
    } @else if (lastSyncFailed()) {
      <span class="badge badge-error">
        <span class="dot dot-red"></span>
        Sync failed
      </span>
    } @else {
      <span class="badge badge-online">
        <span class="dot dot-green"></span>
        Online
      </span>
    }
  `,
  styles: [`
    .badge { display:inline-flex; align-items:center; gap:5px; font-size:0.7rem; font-weight:600;
      padding:2px 8px; border-radius:12px; cursor:default; }
    .badge-online { background:#dcfce7; color:#15803d; }
    .badge-offline, .badge-syncing { background:#fef9c3; color:#92400e; cursor:pointer; }
    .badge-error { background:#fee2e2; color:#b91c1c; }
    .dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
    .dot-green { background:#16a34a; }
    .dot-amber { background:#d97706; }
    .dot-red { background:#dc2626; }
    .dot-pulse { animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
  `]
})
export class SyncStatusBadgeComponent implements OnInit, OnDestroy {
  private syncService = inject(OfflineSyncService);

  isOnline = signal(navigator.onLine);
  pendingCount = signal(0);
  syncing = signal(false);
  lastSyncFailed = signal(false);

  private onlineHandler = () => {
    this.isOnline.set(true);
    this.refresh();
    this.trySync();
  };
  private offlineHandler = () => this.isOnline.set(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.refresh();
    this.intervalId = setInterval(() => this.refresh(), 15000);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    if (this.intervalId) clearInterval(this.intervalId);
  }

  refresh(): void {
    this.pendingCount.set(this.syncService.getPendingCount());
  }

  async trySync(): Promise<void> {
    if (this.syncing() || !this.isOnline()) return;
    this.syncing.set(true);
    this.lastSyncFailed.set(false);
    try {
      const results = await this.syncService.syncAllDrafts();
      const anyFailed = results.some(r => r.error);
      this.lastSyncFailed.set(anyFailed);
    } catch {
      this.lastSyncFailed.set(true);
    } finally {
      this.syncing.set(false);
      this.refresh();
    }
  }
}
