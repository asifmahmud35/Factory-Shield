import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreateIncidentRequest } from './incident.service';

export interface OfflineDraftPayload extends CreateIncidentRequest {
  localDraftId: string;
  payloadHash: string;
  localEventTime: string;
}

export interface SyncResult {
  localDraftId: string;
  isNew: boolean;
  serverIncidentId?: string;
  incidentReference?: string;
  error?: string;
}

export type SyncStatus = 'Queued' | 'Synced' | 'SyncFailed';

export interface StoredDraft extends OfflineDraftPayload {
  syncStatus: SyncStatus;
  savedAt: string;
}

const STORAGE_KEY = 'fs_offline_drafts';

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private http = inject(HttpClient);

  private async sha256(payload: object): Promise<string> {
    const data = new TextEncoder().encode(JSON.stringify(payload));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  getStoredDrafts(): StoredDraft[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  getPendingCount(): number {
    return this.getStoredDrafts().filter(d => d.syncStatus === 'Queued' || d.syncStatus === 'SyncFailed').length;
  }

  async saveDraft(payload: CreateIncidentRequest & { isConfidential: boolean }): Promise<StoredDraft> {
    const localDraftId = crypto.randomUUID();
    const localEventTime = payload.incidentOccurredAt ?? new Date().toISOString();

    const hashInput = {
      category: payload.category,
      shortDescription: payload.shortDescription,
      severity: payload.severity,
      department: payload.department,
      localEventTime,
      isConfidential: payload.isConfidential,
      classificationCategory: payload.classificationCategory,
      subCategory: payload.subCategory,
      factory: payload.factory,
      building: payload.building,
      floor: payload.floor,
      equipment: payload.equipment,
      productionOrder: payload.productionOrder,
      buyer: payload.buyer,
      styleNumber: payload.styleNumber,
      incidentOccurredAt: payload.incidentOccurredAt,
      reporterName: payload.reporterName,
      employeeId: payload.employeeId,
      reporterDepartment: payload.reporterDepartment,
      contactNumber: payload.contactNumber,
      witnesses: payload.witnesses,
      immediateActionTaken: payload.immediateActionTaken,
      exactLocation: payload.exactLocation,
      gpsCoordinates: payload.gpsCoordinates,
      aiSummary: payload.aiSummary,
    };
    const payloadHash = await this.sha256(hashInput);

    const draft: StoredDraft = {
      localDraftId,
      payloadHash,
      localEventTime,
      syncStatus: 'Queued',
      savedAt: new Date().toISOString(),
      ...payload,
    };

    const drafts = this.getStoredDrafts();
    drafts.push(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    return draft;
  }

  async syncAllDrafts(): Promise<SyncResult[]> {
    const drafts = this.getStoredDrafts();
    const pending = drafts.filter(d => d.syncStatus === 'Queued' || d.syncStatus === 'SyncFailed');

    if (pending.length === 0) return [];

    const payloads: OfflineDraftPayload[] = pending.map(d => ({
      localDraftId: d.localDraftId,
      payloadHash: d.payloadHash,
      category: d.category,
      shortDescription: d.shortDescription,
      severity: d.severity,
      department: d.department,
      localEventTime: d.localEventTime,
      isConfidential: d.isConfidential ?? false,
      classificationCategory: d.classificationCategory,
      subCategory: d.subCategory,
      factory: d.factory,
      building: d.building,
      floor: d.floor,
      equipment: d.equipment,
      productionOrder: d.productionOrder,
      buyer: d.buyer,
      styleNumber: d.styleNumber,
      incidentOccurredAt: d.incidentOccurredAt,
      reporterName: d.reporterName,
      employeeId: d.employeeId,
      reporterDepartment: d.reporterDepartment,
      contactNumber: d.contactNumber,
      witnesses: d.witnesses,
      immediateActionTaken: d.immediateActionTaken,
      exactLocation: d.exactLocation,
      gpsCoordinates: d.gpsCoordinates,
      aiSummary: d.aiSummary,
    }));

    let results: SyncResult[] = [];
    try {
      results = await firstValueFrom(
        this.http.post<SyncResult[]>('/api/v1/incidents/offline-sync', payloads)
      );
    } catch {
      return pending.map(d => ({
        localDraftId: d.localDraftId,
        isNew: false,
        error: 'Network error during sync',
      }));
    }

    const resultMap = new Map(results.map(r => [r.localDraftId, r]));
    const updated = drafts.map(d => {
      const result = resultMap.get(d.localDraftId);
      if (!result) return d;
      return {
        ...d,
        syncStatus: (result.error ? 'SyncFailed' : 'Synced') as SyncStatus,
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return results;
  }

  clearSynced(): void {
    const drafts = this.getStoredDrafts().filter(d => d.syncStatus !== 'Synced');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }
}
