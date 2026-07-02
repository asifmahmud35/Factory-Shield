import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CorrectiveAction {
  id: string;
  incidentId: string;
  title: string;
  description: string | null;
  owner: string | null;
  dueDate: string | null;
  priority: number;
  completionPercentage: number;
  status: string;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateActionRequest {
  title: string;
  description?: string | null;
  owner?: string | null;
  dueDate?: string | null;
  priority?: number;
}

export interface UpdateActionRequest {
  completionPercentage?: number;
  status?: string;
  verifiedBy?: string | null;
  owner?: string | null;
  dueDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CapaService {
  private http = inject(HttpClient);

  getActions(incidentId: string): Observable<CorrectiveAction[]> {
    return this.http.get<CorrectiveAction[]>(`/api/v1/incidents/${incidentId}/actions`);
  }

  createAction(incidentId: string, req: CreateActionRequest): Observable<{ actionId: string }> {
    return this.http.post<{ actionId: string }>(`/api/v1/incidents/${incidentId}/actions`, req);
  }

  updateAction(actionId: string, req: UpdateActionRequest): Observable<void> {
    return this.http.patch<void>(`/api/v1/actions/${actionId}`, req);
  }

  completeAction(actionId: string): Observable<void> {
    return this.http.post<void>(`/api/v1/actions/${actionId}/complete`, {});
  }

  uploadEvidence(actionId: string, file: File): Observable<{ attachmentId: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ attachmentId: string }>(
      `/api/v1/actions/${actionId}/evidence`,
      formData,
    );
  }
}
