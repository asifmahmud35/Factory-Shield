import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface CreateIncidentRequest {
  category: string;
  shortDescription: string;
  severity?: number;
  department?: string;
  isConfidential?: boolean;
  qrCodeId?: string;
  manualOverrideReason?: string;
  classificationCategory?: string;
  subCategory?: string;
  factory?: string;
  building?: string;
  floor?: string;
  equipment?: string;
  productionOrder?: string;
  buyer?: string;
  styleNumber?: string;
  incidentOccurredAt?: string;
  reporterName?: string;
  employeeId?: string;
  reporterDepartment?: string;
  contactNumber?: string;
  witnesses?: string;
  immediateActionTaken?: string;
  exactLocation?: string;
  gpsCoordinates?: string;
  aiSummary?: string;
}

export interface CreateIncidentResponse {
  incident_id: string;
  incident_reference: string;
}

export interface ReportFormCategoryOption {
  name: string;
  subcategories: string[];
}

export interface ReportFormFactoryOption {
  id: string;
  name: string;
  location: string | null;
  lines: string[];
}

export interface ReportFormSeverityOption {
  value: number;
  label: string;
}

export interface ReportFormOptions {
  incidentTypes: string[];
  categories: ReportFormCategoryOption[];
  factories: ReportFormFactoryOption[];
  reporterDepartments: string[];
  buildings: string[];
  floors: string[];
  severityLevels: ReportFormSeverityOption[];
}

export interface UploadAttachmentResponse {
  attachment_id: string;
}

export interface Resolver {
  id: string;
  name: string;
  email: string;
}

export interface IncidentSummary {
  id: string;
  incidentReference: string;
  category: string;
  severity: number;
  displayStatus: string;
  createdAt: string;
  incidentDate?: string;
  department?: string;
  area?: string;
  reportedBy?: string;
  assignedTo?: string;
  assignedToInitials?: string;
  assignedToColor?: string;
  dueDate?: string;
  slaStartedAt?: string | null;
  slaTargetMinutes?: number | null;
  slaStage?: string | null;
  claimedById?: string | null;
  claimedByEmail?: string | null;
  claimExpiresAt?: string | null;
  isConfidential?: boolean;
  reporterDisplay?: string | null;
}

export interface IncidentDetail {
  id: string;
  incidentReference: string;
  category: string;
  severity: number;
  displayStatus: string;
  shortDescription: string;
  department: string | null;
  createdAt: string;
  reporterDisplay: string | null;
  assignedTo: string | null;
  slaStartedAt: string | null;
  slaTargetMinutes: number | null;
  slaStage: string | null;
  isConfidential: boolean;
  escalationLevel: number;
  sourceChannel: string;
  rejectReason: string | null;
}

export interface ActionsSummary {
  totalActions: number;
  inProgress: number;
  open: number;
  completed: number;
  overallPercentage: number;
}

export interface IncidentAttachment {
  id: string;
  mimeType: string;
  storageKey: string;
  evidenceNote: string | null;
  uploaderName: string | null;
  uploadedAt: string;
  correctiveActionId: string | null;
}

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private http = inject(HttpClient);

  createIncident(request: CreateIncidentRequest): Observable<CreateIncidentResponse> {
    return this.http.post<CreateIncidentResponse>('/api/v1/incidents', request);
  }

  getReportFormOptions(): Observable<ReportFormOptions> {
    return this.http.get<ReportFormOptions>('/api/v1/incidents/report-form-options');
  }

  getMyIncidents(): Observable<IncidentSummary[]> {
    return this.http.get<IncidentSummary[]>('/api/v1/incidents/mine');
  }

  /** Org-wide list ("All Incidents") for non-Reporter roles — every incident, not just the caller's own. */
  getAllIncidents(): Observable<IncidentSummary[]> {
    return this.http.get<Array<IncidentSummary & { reporterDisplay?: string | null; assignedToName?: string | null }>>(
      '/api/v1/incidents',
    ).pipe(
      map(rows => rows.map(r => ({
        ...r,
        reportedBy: r.reporterDisplay ?? undefined,
        assignedTo: r.assignedToName ?? undefined,
      }))),
    );
  }

  getIncident(idOrReference: string): Observable<IncidentDetail> {
    const path = isGuid(idOrReference)
      ? `/api/v1/incidents/${idOrReference}`
      : `/api/v1/incidents/ref/${encodeURIComponent(idOrReference)}`;
    return this.http.get<IncidentDetail>(path);
  }

  getActionsSummary(incidentId: string): Observable<ActionsSummary> {
    return this.http.get<ActionsSummary>(`/api/v1/incidents/${incidentId}/actions/summary`);
  }

  getAttachments(incidentId: string): Observable<IncidentAttachment[]> {
    return this.http.get<IncidentAttachment[]>(`/api/v1/incidents/${incidentId}/attachments`);
  }

  getApproverQueue(): Observable<IncidentSummary[]> {
    return this.http.get<IncidentSummary[]>('/api/v1/approver/queue');
  }

  getResolvers(): Observable<Resolver[]> {
    return this.http.get<Resolver[]>('/api/v1/approver/resolvers');
  }

  approveIncident(id: string, resolverUserId: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${id}/approve`, { resolverUserId });
  }

  rejectIncident(id: string, rejectType: 'Soft' | 'Hard', reason: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${id}/reject`, { rejectType, reason });
  }

  getAssignedIncidents(): Observable<IncidentSummary[]> {
    return this.http.get<IncidentSummary[]>('/api/v1/resolver/assigned');
  }

  escalateIncident(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${id}/escalate`, { reason });
  }

  // FS-16
  claimIncident(id: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${id}/claim`, {});
  }

  releaseIncident(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/incidents/${id}/claim`);
  }

  // FS-17
  reassignIncident(id: string, newCategory: string, newSeverity: number, reason: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${id}/reassign`, { newCategory, newSeverity, reason });
  }

  // FS-18
  mergeIncident(duplicateId: string, primaryIncidentId: string, reason: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${duplicateId}/merge`, { primaryIncidentId, reason });
  }

  // FS-19
  requestInfo(id: string, question: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${id}/request-info`, { question });
  }

  provideInfo(id: string, response: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${id}/provide-info`, { response });
  }

  uploadAttachment(incidentId: string, file: File): Observable<UploadAttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<UploadAttachmentResponse>(
      `/api/v1/incidents/${incidentId}/attachments`,
      formData
    );
  }
}

function isGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
