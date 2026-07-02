import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CountBySeverity { severity: number; label: string; count: number; }
export interface CountByStatus   { status: string; count: number; }
export interface CountByDepartment { department: string; count: number; }

export interface ExecutiveDashboard {
  totalOpen: number;
  totalResolved: number;
  totalClosed: number;
  bySeverity: CountBySeverity[];
  byStatus: CountByStatus[];
  byDepartment: CountByDepartment[];
  avgResolutionMinutes: number;
  slaBreachCount: number;
  capaCompletionRate: number;
}

export interface SubmitApprovalRequest {
  approvalType: string;
  isApprove: boolean;
  rejectionReason?: string;
}

export interface TimelineEntry {
  id: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  description: string | null;
  previousValue: string | null;
  newValue: string | null;
  visibilityScope: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class GovernanceService {
  private http = inject(HttpClient);
  private base = '/api/v1';

  getExecutiveDashboard(from?: string, to?: string): Observable<ExecutiveDashboard> {
    let params = '';
    if (from) params += `?from=${from}`;
    if (to) params += `${params ? '&' : '?'}to=${to}`;
    return this.http.get<ExecutiveDashboard>(`${this.base}/dashboard/executive${params}`);
  }

  submitApproval(incidentId: string, body: SubmitApprovalRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/approvals/${incidentId}`, body);
  }

  getTimeline(incidentId: string): Observable<TimelineEntry[]> {
    return this.http.get<TimelineEntry[]>(`${this.base}/incidents/${incidentId}/timeline`);
  }

  unmaskReporter(incidentId: string, reason: string): Observable<{ reporterEmail: string | null }> {
    return this.http.post<{ reporterEmail: string | null }>(
      `${this.base}/incidents/${incidentId}/unmask-reporter`,
      { reason }
    );
  }
}
