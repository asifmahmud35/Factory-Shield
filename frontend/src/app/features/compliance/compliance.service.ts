import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IncidentPipelineItem {
  stage: string;
  count: number;
}

export interface MethodologyItem {
  methodology: string;
  count: number;
  requiresWeeklyReview: boolean;
}

export interface RepeatFailureCapaItem {
  incidentReference: string;
  capaTitle: string;
  rejectionCount: number;
  daysOverdue: number;
  blocksClosure: boolean;
}

export interface IdentityAccessAuditItem {
  accessorName: string;
  accessorRole: string;
  incidentReference: string;
  purpose: string;
  accessedAt: string;
}

export interface RejectionDisputeItem {
  incidentReference: string;
  rejectReason: string;
  disputeStatus: string;
  rejectedAt: string;
  reopenedFromRejection: boolean;
}

export interface LoopGuardItem {
  incidentReference: string;
  rerouteCount: number;
  daysStalled: number;
  tiebreakPending: boolean;
}

export interface EscalationExhaustedItem {
  incidentReference: string;
  fallbackNotifiedRole: string;
  exhaustedAt: string;
  hoursElapsed: number;
}

export interface ComplianceDashboard {
  from: string;
  to: string;
  panelA_IncidentPipeline: IncidentPipelineItem[];
  panelB_InvestigationMethodology: MethodologyItem[];
  panelC_RepeatFailureCapa: RepeatFailureCapaItem[];
  panelD_IdentityAccessAudit: IdentityAccessAuditItem[];
  panelE_RejectionDispute: RejectionDisputeItem[];
  panelF_LoopGuard: LoopGuardItem[];
  panelG_EscalationExhausted: EscalationExhaustedItem[];
}

@Injectable({ providedIn: 'root' })
export class ComplianceService {
  private http = inject(HttpClient);
  private base = '/api/v1/compliance';

  getDashboard(from?: string, to?: string): Observable<ComplianceDashboard> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<ComplianceDashboard>(`${this.base}/dashboard`, { params });
  }

  getIdentityAudit(from?: string, to?: string, actorId?: string): Observable<IdentityAccessAuditItem[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (actorId) params['actorId'] = actorId;
    return this.http.get<IdentityAccessAuditItem[]>(`${this.base}/identity-access-audit`, { params });
  }

  exportAuditPackage(incidentId: string): Observable<Blob> {
    return this.http.get(`${this.base}/export/${incidentId}`, { responseType: 'blob' });
  }
}
