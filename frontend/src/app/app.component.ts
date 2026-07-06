import { Component, inject, OnDestroy, OnInit, signal, effect } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './features/notifications/notification.service';
import { RecentIncidentService } from './core/services/recent-incident.service';
import { SyncStatusBadgeComponent } from './shared/components/sync-status-badge.component';
import { ApprovalsService } from './features/approver/approvals.service';
import { IncidentService } from './features/incidents/incident.service';

const INCIDENTS_ROUTE_PREFIXES = ['/my-incidents', '/report', '/incidents/'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SyncStatusBadgeComponent],
  template: `
    @if (auth.isAuthenticated()) {

      <div class="app-shell">

        <!-- ── Top Navbar ── -->
        <header class="app-navbar">

          <!-- Brand -->
          <div class="navbar-brand">
            <div class="navbar-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div class="navbar-app-name">FactoryShield</div>
              <div class="navbar-app-sub">Incident Management</div>
            </div>
          </div>

          <!-- Search -->
          <div class="navbar-search">
            <span class="navbar-search__icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input type="text" placeholder="Search...">
          </div>

          <!-- Right actions -->
          <div class="navbar-right">

            <!-- Chat -->
            <button class="navbar-icon-btn" title="Messages">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            <!-- Bell with badge -->
            <a class="navbar-icon-btn" routerLink="/notifications" title="Notifications">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              @if (notifSvc.unreadCount() > 0) {
                <span class="navbar-badge">{{ badgeLabel() }}</span>
              }
            </a>

            <!-- Settings -->
            <a class="navbar-icon-btn" routerLink="/settings" title="Settings">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </a>

            <app-sync-status-badge></app-sync-status-badge>

            <div class="navbar-sep"></div>

            <!-- User -->
            <div class="navbar-user">
              <div class="navbar-user__info">
                <div class="navbar-user__name">{{ displayName }}</div>
                <div class="navbar-user__role">{{ auth.currentRole() }}</div>
              </div>
              <div class="navbar-user__avatar">{{ roleInitial }}</div>
            </div>

          </div>
        </header>

        <!-- ── App layout (sidebar + content) ── -->
        <div class="app-layout">

          <!-- Sidebar -->
          <nav class="app-sidebar">

            <div class="nav-body">

              <!-- Dashboard -->
              <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                Dashboard
              </a>

              <!-- Incident Management -->
              <div class="nav-section">
                <div class="nav-section__label">Incident Management</div>

                <div class="nav-item" (click)="incidentsOpen.set(!incidentsOpen())">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Incidents
                  <svg [class]="'nav-chevron' + (incidentsOpen() ? ' nav-chevron--open' : '')"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                @if (incidentsOpen()) {
                  <div class="nav-sub">
                    <a class="nav-sub-item" routerLink="/my-incidents" routerLinkActive="active">
                      <svg class="nav-sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/>
                        <line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/>
                        <line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
                      </svg>
                      All Incidents
                    </a>
                    <a class="nav-sub-item" routerLink="/report" routerLinkActive="active">
                      <svg class="nav-sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Report Incident
                    </a>
                    <a class="nav-sub-item" [routerLink]="incidentDetailLink()"
                      [class.active]="isIncidentDetailNavActive()"
                      [title]="incidentDetailLinkTitle()">
                      <svg class="nav-sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      Incident Detail
                    </a>
                  </div>
                }

                <a class="nav-item" routerLink="/investigation"
                  [class.active]="isInvestigationNavActive()">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Investigation
                </a>

                <a class="nav-item" routerLink="/rca" [class.active]="isRcaNavActive()">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  Root Cause Analysis
                </a>

                <a class="nav-item" routerLink="/capa" [class.active]="isCapaNavActive()">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Corrective Actions
                  @if (capaCount() !== null && capaCount()! > 0) {
                    <span class="nav-badge">{{ capaCount() }}</span>
                  }
                </a>

                <a class="nav-item" routerLink="/escalation" routerLinkActive="active">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <path d="M12 9v4"/><path d="M12 17h.01"/>
                  </svg>
                  Escalation
                </a>

                <a class="nav-item" routerLink="/approvals" routerLinkActive="active">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <rect width="6" height="4" x="9" y="3" rx="2"/>
                    <path d="m9 14 2 2 4-4"/>
                  </svg>
                  Approvals
                  @if (approvalsCount() !== null && approvalsCount()! > 0) {
                    <span class="nav-badge">{{ approvalsCount() }}</span>
                  }
                </a>

              </div>

              <!-- Reporting -->
              <div class="nav-section">
                <div class="nav-section__label">Reporting</div>

                @if (showAnalytics) {
                  <a class="nav-item" routerLink="/analytics" routerLinkActive="active">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/>
                      <line x1="6" x2="6" y1="20" y2="16"/>
                    </svg>
                    Analytics
                  </a>
                }

                <a class="nav-item" routerLink="/notifications" routerLinkActive="active">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                  </svg>
                  Notifications
                </a>
              </div>

              <!-- System -->
              <div class="nav-section">
                <div class="nav-section__label">System</div>

                <a class="nav-item" routerLink="/administration"
                  [class.active]="isAdministrationNavActive()">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                    <polyline points="2 17 12 22 22 17"/>
                    <polyline points="2 12 12 17 22 12"/>
                  </svg>
                  Administration
                </a>

                <a class="nav-item" routerLink="/administration" [queryParams]="{section:'user-roles'}"
                  [class.active]="isAdminSectionActive('user-roles')">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  User Roles
                </a>

                <a class="nav-item" routerLink="/administration" [queryParams]="{section:'workflow'}"
                  [class.active]="isAdminSectionActive('workflow')">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="6" x2="6" y1="3" y2="15"/>
                    <circle cx="18" cy="6" r="3"/>
                    <circle cx="6" cy="18" r="3"/>
                    <path d="M18 9a9 9 0 0 1-9 9"/>
                  </svg>
                  Workflow Config
                </a>

                <a class="nav-item" routerLink="/settings" routerLinkActive="active">
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Settings
                </a>
              </div>

            </div>

            <!-- User footer -->
            <div class="sidebar-user">
              <div class="sidebar-user__avatar">{{ roleInitial }}</div>
              <div style="flex:1;min-width:0">
                <div class="sidebar-user__role">{{ auth.currentRole() }}</div>
                <button class="sidebar-user__signout" (click)="auth.logout()">Sign out</button>
              </div>
            </div>

          </nav>

          <!-- Page content -->
          <main class="app-main">
            <router-outlet />
          </main>

        </div>
      </div>

    } @else {
      <router-outlet />
    }
  `
})
export class AppComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  notifSvc = inject(NotificationService);
  recentIncident = inject(RecentIncidentService);
  private router = inject(Router);
  private approvalsSvc = inject(ApprovalsService);
  private incidentSvc = inject(IncidentService);

  incidentsOpen = signal(this.isIncidentsRoute(this.router.url));
  adminSection = signal<string | null>(null);

  /** Sidebar badge counts — null hides the badge (role has no data / request failed). */
  capaCount = signal<number | null>(null);
  approvalsCount = signal<number | null>(null);

  constructor() {
    // Open/close the real-time notification push connection as auth state
    // changes, so it reconnects right after an interactive login too (not
    // just after a page refresh with a restored session).
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.notifSvc.connect();
      } else {
        this.notifSvc.disconnect();
      }
    });
  }

  ngOnInit(): void {
    this.syncAdminSection(this.router.url);
    this.refreshNavBadges();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e) => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      if (this.isIncidentsRoute(url)) {
        this.incidentsOpen.set(true);
      }
      this.syncAdminSection(url);
      this.refreshNavBadges();
    });
  }

  /** Reloads the sidebar counts for the current role; runs on init and every navigation. */
  private refreshNavBadges(): void {
    if (!this.auth.isAuthenticated()) {
      this.capaCount.set(null);
      this.approvalsCount.set(null);
      return;
    }
    const role = (this.auth.currentRole() ?? '').toUpperCase();

    if (role === 'RESOLVER') {
      this.incidentSvc.getAssignedIncidents().subscribe({
        next: list => this.capaCount.set(list.length),
        error: () => this.capaCount.set(null),
      });
    } else {
      this.capaCount.set(null);
    }

    if (role === 'APPROVER' || role === 'ADMIN') {
      this.approvalsSvc.getPending().subscribe({
        next: list => this.approvalsCount.set(list.length),
        error: () => this.approvalsCount.set(null),
      });
    } else {
      this.approvalsCount.set(null);
    }
  }

  private syncAdminSection(url: string): void {
    if (!url.startsWith('/administration')) {
      this.adminSection.set(null);
      return;
    }
    const query = url.split('?')[1] ?? '';
    const section = new URLSearchParams(query).get('section');
    this.adminSection.set(section);
  }

  isAdministrationNavActive(): boolean {
    return this.router.url.startsWith('/administration')
      && this.adminSection() !== 'user-roles'
      && this.adminSection() !== 'workflow';
  }

  isAdminSectionActive(section: string): boolean {
    return this.router.url.startsWith('/administration') && this.adminSection() === section;
  }

  isInvestigationNavActive(): boolean {
    const url = this.router.url;
    return url === '/investigation' || url.startsWith('/resolver/incidents/') && url.endsWith('/investigation');
  }

  isRcaNavActive(): boolean {
    const url = this.router.url;
    return url === '/rca' || url.startsWith('/resolver/incidents/') && url.endsWith('/rca');
  }

  isCapaNavActive(): boolean {
    const url = this.router.url;
    return url === '/capa' || url.startsWith('/resolver/incidents/') && url.endsWith('/capa');
  }

  private isIncidentsRoute(url: string): boolean {
    return INCIDENTS_ROUTE_PREFIXES.some(p => url.startsWith(p));
  }

  ngOnDestroy(): void {
    this.notifSvc.disconnect();
  }

  badgeLabel(): string {
    const n = this.notifSvc.unreadCount();
    return n > 99 ? '99+' : String(n);
  }

  /** Sidebar "Incident Detail" — stay on current detail, else last viewed, else list. */
  incidentDetailLink(): (string | number)[] {
    const ref = this.currentIncidentRouteRef() ?? this.recentIncident.lastViewedRef();
    return ref ? ['/incidents', ref] : ['/my-incidents'];
  }

  isIncidentDetailNavActive(): boolean {
    return this.currentIncidentRouteRef() !== null;
  }

  incidentDetailLinkTitle(): string {
    const ref = this.currentIncidentRouteRef() ?? this.recentIncident.lastViewedRef();
    return ref ? `Incident ${ref}` : 'Pick an incident from All Incidents';
  }

  private currentIncidentRouteRef(): string | null {
    const match = this.router.url.match(/^\/incidents\/([^/?#]+)/);
    return match?.[1] ?? null;
  }

  /** Matches the backend's `GovernanceOnly` policy — keep in sync with Program.cs / analyticsGuard. */
  private static readonly ANALYTICS_ROLES = new Set([
    'APPROVER', 'ADMIN',
  ]);

  get showAnalytics(): boolean {
    return AppComponent.ANALYTICS_ROLES.has((this.auth.currentRole() ?? '').toUpperCase());
  }

  get roleInitial(): string {
    return (this.auth.currentRole() ?? 'U').charAt(0).toUpperCase();
  }

  get displayName(): string {
    const email = this.auth.currentEmail();
    if (email) {
      const prefix = email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[._-]/g, ' ');
    }
    const role = this.auth.currentRole() ?? 'User';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
}
