import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PendingApproval {
  incidentId: string;
  incidentReference: string;
  severity: number;
  severityLabel: string;
  approvalType: string;   // e.g. "CapaVerification"
  approvalTitle: string;  // e.g. "CAPA Verification"
  title: string;          // incident short description
  submittedBy: string | null;
  submittedAt: string;
}

export interface SubmitApprovalBody {
  approvalType: string;
  isApprove: boolean;
  rejectionReason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApprovalsService {
  private http = inject(HttpClient);
  private base = '/api/v1/approvals';

  getPending(): Observable<PendingApproval[]> {
    return this.http.get<PendingApproval[]>(`${this.base}/pending`);
  }

  submit(incidentId: string, body: SubmitApprovalBody): Observable<void> {
    return this.http.post<void>(`${this.base}/${incidentId}`, body);
  }
}
