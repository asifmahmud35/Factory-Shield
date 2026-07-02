import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'fs_last_incident_ref';

@Injectable({ providedIn: 'root' })
export class RecentIncidentService {
  readonly lastViewedRef = signal<string | null>(this.readStored());

  setLastViewed(reference: string): void {
    const ref = reference.trim();
    if (!ref) return;
    this.lastViewedRef.set(ref);
    try {
      localStorage.setItem(STORAGE_KEY, ref);
    } catch {
      // localStorage unavailable — in-memory signal still works for this session
    }
  }

  private readStored(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
