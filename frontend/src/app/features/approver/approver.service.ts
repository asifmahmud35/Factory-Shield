import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApprovalChainEntry {
  gate: string;
  approvalLevelAtAction: number;
  actorName: string;
  actorRole: string;
  isApprove: boolean;
  rejectionReason: string | null;
  submittedAt: string;
}

export interface ClaimHistoryEntry {
  approverName: string;
  approverRole: string;
  claimedAt: string;
  expiresAt: string;
  isActive: boolean;
  durationMinutes: number;
}

export interface RoutingEvent {
  previousCategory: string;
  newCategory: string;
  previousSeverity: number;
  newSeverity: number;
  changedByName: string;
  reason: string | null;
  changedAt: string;
  triggeredLoopGuard: boolean;
}

export interface ApprovalAuditTrail {
  incidentId: string;
  incidentReference: string;
  currentEscalationLevel: number;
  loopGuardTriggered: boolean;
  routeCount: number;
  approvalChain: ApprovalChainEntry[];
  claimHistory: ClaimHistoryEntry[];
  routingEvents: RoutingEvent[];
}

@Injectable({ providedIn: 'root' })
export class ApproverService {
  private http = inject(HttpClient);

  getApprovalAuditTrail(incidentId: string): Observable<ApprovalAuditTrail> {
    return this.http.get<ApprovalAuditTrail>(
      `/api/v1/incidents/${incidentId}/approval-audit-trail`,
    );
  }
}
