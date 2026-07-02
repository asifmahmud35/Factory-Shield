import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActiveEscalationDto {
  id: string;
  incidentId: string;
  incidentReference: string;
  severity: string;
  title: string;
  escalatedTo: string;
  day: number;
  progressPct: number;
  slaRemainingMinutes: number;
  slaOverdue: boolean;
}

export interface EscalationRuleDto {
  id: string;
  name: string;
  description: string;
  triggerAfterMinutes: number;
  channels: string[];
  recipients: string[];
  active: boolean;
}

export interface EscalationNotificationDto {
  id: string;
  incidentReference: string;
  ruleName: string;
  via: string;
  recipients: string;
  sentAt: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class EscalationService {
  private http = inject(HttpClient);
  private base = '/api/v1/escalations';

  getActive(): Observable<ActiveEscalationDto[]> {
    return this.http.get<ActiveEscalationDto[]>(`${this.base}/active`);
  }

  getRules(): Observable<EscalationRuleDto[]> {
    return this.http.get<EscalationRuleDto[]>(`${this.base}/rules`);
  }

  createRule(body: { name: string; description?: string; triggerAfterMinutes: number; channels: string[]; recipients: string[]; active?: boolean }): Observable<{ id: string; name: string }> {
    return this.http.post<{ id: string; name: string }>(`${this.base}/rules`, body);
  }

  updateRule(id: string, patch: Partial<{ name: string; description: string; triggerAfterMinutes: number; channels: string[]; recipients: string[]; active: boolean }>): Observable<void> {
    return this.http.put<void>(`${this.base}/rules/${id}`, patch);
  }

  deleteRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/rules/${id}`);
  }

  getNotifications(): Observable<EscalationNotificationDto[]> {
    return this.http.get<EscalationNotificationDto[]>(`${this.base}/notifications`);
  }
}
