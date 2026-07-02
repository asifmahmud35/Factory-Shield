import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { AuthService } from '../../core/services/auth.service';

export interface NotificationDto {
  id: string;
  type: string;
  stage: string;
  subject: string | null;
  body: string | null;
  channel: string | null;
  deepLinkPath: string | null;
  triggerEvent: string | null;
  isRead: boolean;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
}

export interface NotificationsPage {
  items: NotificationDto[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export interface NotificationPush {
  id: string;
  type: string;
  subject: string;
  body: string;
  deepLinkPath: string | null;
  incidentId: string | null;
  createdAt: string;
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = '/api/v1/notifications';
  private hubConnection?: HubConnection;

  readonly unreadCount = signal(0);
  /** Emits whenever a push notification arrives, so an open list view can refresh. */
  readonly notificationReceived$ = new Subject<NotificationPush>();

  getNotifications(unreadOnly = false, page = 1, pageSize = 20): Observable<NotificationsPage> {
    return this.http.get<NotificationsPage>(this.base, {
      params: { unreadOnly: String(unreadOnly), page: String(page), pageSize: String(pageSize) },
    });
  }

  getCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.base}/count`);
  }

  refreshCount(): void {
    this.getCount().subscribe({
      next: r => this.unreadCount.set(r.unreadCount),
      error: () => {},
    });
  }

  /** Opens the real-time notification push connection and does an initial count sync. */
  connect(): void {
    if (this.hubConnection) return;
    this.refreshCount();

    this.hubConnection = new HubConnectionBuilder()
      .withUrl('/hubs/notifications', { accessTokenFactory: () => this.auth.getToken() ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.hubConnection.on('notificationReceived', (payload: NotificationPush) => {
      this.unreadCount.set(payload.unreadCount);
      this.notificationReceived$.next(payload);
    });

    // Reconnects can miss events that fired while offline — resync the count.
    this.hubConnection.onreconnected(() => this.refreshCount());

    this.hubConnection.start().catch(() => {
      // Connection failures are non-fatal — the badge simply won't live-update
      // until the next successful (re)connect attempt.
    });
  }

  disconnect(): void {
    if (!this.hubConnection) return;
    const connection = this.hubConnection;
    this.hubConnection = undefined;
    if (connection.state !== HubConnectionState.Disconnected) {
      connection.stop();
    }
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCount();
        if (current > 0) this.unreadCount.set(current - 1);
      }),
    );
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.base}/read-all`, {}).pipe(
      tap(() => this.unreadCount.set(0)),
    );
  }
}
