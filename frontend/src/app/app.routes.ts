import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ReportFormComponent } from './features/incidents/report-form/report-form.component';
import { MyIncidentsListComponent } from './features/incidents/my-incidents/my-incidents-list.component';
import { IncidentDetailComponent } from './features/incidents/incident-detail/incident-detail.component';
import { ApproverQueueComponent } from './features/approver/approver-queue.component';
import { ApprovalsComponent } from './features/approver/approvals.component';
import { AssignedDashboardComponent } from './features/resolver/assigned-dashboard.component';
import { InvestigationEntryComponent } from './features/resolver/investigation-entry.component';
import { RcaEntryComponent } from './features/resolver/rca-entry.component';
import { CapaEntryComponent } from './features/resolver/capa-entry.component';
import { InvestigationWorkspaceComponent } from './features/resolver/investigation-workspace.component';
import { RcaComponent } from './features/resolver/rca/rca.component';
import { CorrectiveActionsComponent } from './features/resolver/corrective-actions/corrective-actions.component';
import { EscalationComponent } from './features/escalation/escalation.component';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { AdministrationComponent } from './features/administration/administration.component';
import { ExecutiveDashboardComponent } from './features/governance/executive-dashboard.component';
import { ComplianceDashboardComponent } from './features/compliance/compliance-dashboard.component';
import { SettingsComponent } from './features/settings/settings.component';
import { QrScanComponent } from './features/incidents/qr-scan/qr-scan.component';
import { roleGuard, analyticsGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard] },
  { path: 'report', component: ReportFormComponent, canActivate: [roleGuard] },
  { path: 'report/qr/:code', component: QrScanComponent },
  { path: 'my-incidents', component: MyIncidentsListComponent, canActivate: [roleGuard] },
  { path: 'incidents/:id', component: IncidentDetailComponent, canActivate: [roleGuard] },
  { path: 'approvals', component: ApprovalsComponent, canActivate: [roleGuard], data: { roles: ['ADMIN', 'APPROVER'] } },
  { path: 'approver/queue', component: ApproverQueueComponent, canActivate: [roleGuard], data: { roles: ['APPROVER'] } },
  { path: 'approver/incidents/:id', redirectTo: 'incidents/:id', pathMatch: 'full' },
  { path: 'resolver/assigned', redirectTo: 'investigation', pathMatch: 'full' },
  { path: 'investigation', component: InvestigationEntryComponent, canActivate: [roleGuard], data: { roles: ['RESOLVER'] } },
  { path: 'investigation/queue', component: AssignedDashboardComponent, canActivate: [roleGuard], data: { mode: 'investigation', roles: ['RESOLVER'] } },
  { path: 'rca', component: RcaEntryComponent, canActivate: [roleGuard], data: { roles: ['RESOLVER'] } },
  { path: 'rca/queue', component: AssignedDashboardComponent, canActivate: [roleGuard], data: { mode: 'rca', roles: ['RESOLVER'] } },
  { path: 'capa', component: CapaEntryComponent, canActivate: [roleGuard], data: { roles: ['RESOLVER'] } },
  { path: 'capa/queue', component: AssignedDashboardComponent, canActivate: [roleGuard], data: { mode: 'capa', roles: ['RESOLVER'] } },
  { path: 'resolver/incidents/:id/investigation', component: InvestigationWorkspaceComponent, canActivate: [roleGuard], data: { roles: ['RESOLVER'] } },
  { path: 'resolver/incidents/:id/rca', component: RcaComponent, canActivate: [roleGuard], data: { roles: ['RESOLVER'] } },
  { path: 'resolver/incidents/:id/capa', component: CorrectiveActionsComponent, canActivate: [roleGuard], data: { roles: ['RESOLVER'] } },
  { path: 'escalation', component: EscalationComponent, canActivate: [roleGuard], data: { roles: ['ADMIN', 'APPROVER'] } },
  { path: 'analytics',      component: AnalyticsComponent,      canActivate: [analyticsGuard] },
  { path: 'notifications',   component: NotificationsComponent,   canActivate: [roleGuard] },
  { path: 'administration', component: AdministrationComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'settings', component: SettingsComponent, canActivate: [roleGuard] },
  { path: 'governance/executive', component: ExecutiveDashboardComponent, canActivate: [roleGuard], data: { roles: ['ADMIN', 'APPROVER'] } },
  { path: 'compliance/dashboard', component: ComplianceDashboardComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
];
