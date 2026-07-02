import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OpenInvestigationResponse {
  investigationId: string;
}

export interface ChecklistItem {
  id: string;
  sortOrder: number;
  label: string;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  description: string;
  occurredAt: string;
}

export interface InvestigationWorkspace {
  investigationId: string;
  incidentId: string;
  incidentReference: string;
  incidentTitle: string;
  owner: string | null;
  investigationDate: string | null;
  targetCompletionDate: string | null;
  riskLevel: string | null;
  notes: string | null;
  findingsSummary: string | null;
  immediateActionTaken: string | null;
  lessonsLearned: string | null;
  openedAt: string;
  updatedAt: string | null;
  checklistItems: ChecklistItem[];
  timelineEvents: TimelineEvent[];
}

export interface SaveInvestigationRequest {
  owner?: string | null;
  investigationDate?: string | null;
  targetCompletionDate?: string | null;
  riskLevel?: string | null;
  notes?: string | null;
  findingsSummary?: string | null;
  immediateActionTaken?: string | null;
  lessonsLearned?: string | null;
}

export interface ToggleChecklistResult {
  isCompleted: boolean;
  completedCount: number;
  totalCount: number;
}

export interface EvidenceItem {
  id: string;
  mimeType: string;
  storageKey: string;
  evidenceNote: string | null;
  uploaderName: string | null;
  uploadedAt: string;
}

@Injectable({ providedIn: 'root' })
export class InvestigationService {
  private http = inject(HttpClient);

  openInvestigation(incidentId: string): Observable<OpenInvestigationResponse> {
    return this.http.post<OpenInvestigationResponse>(
      `/api/v1/incidents/${incidentId}/investigation`, {}
    );
  }

  getInvestigation(incidentId: string): Observable<InvestigationWorkspace> {
    return this.http.get<InvestigationWorkspace>(
      `/api/v1/incidents/${incidentId}/investigation`
    );
  }

  saveInvestigation(incidentId: string, data: SaveInvestigationRequest): Observable<void> {
    return this.http.put<void>(
      `/api/v1/incidents/${incidentId}/investigation`, data
    );
  }

  toggleChecklistItem(incidentId: string, itemId: string): Observable<ToggleChecklistResult> {
    return this.http.post<ToggleChecklistResult>(
      `/api/v1/incidents/${incidentId}/investigation/checklist/${itemId}/toggle`, {}
    );
  }

  getAttachments(incidentId: string): Observable<EvidenceItem[]> {
    return this.http.get<EvidenceItem[]>(`/api/v1/incidents/${incidentId}/attachments`);
  }

  uploadEvidence(incidentId: string, file: File): Observable<{ attachment_id: string }> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<{ attachment_id: string }>(
      `/api/v1/incidents/${incidentId}/attachments`, fd
    );
  }

  resolveIncident(incidentId: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${incidentId}/resolve`, {});
  }
}
