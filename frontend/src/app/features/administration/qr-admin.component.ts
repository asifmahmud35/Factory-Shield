import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface QrCodeItem {
  id: string;
  code: string;
  qrType: string;
  label: string;
  factoryId?: string;
  sectionId?: string;
  lineId?: string;
  machineId?: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt?: string;
  createdAt: string;
}

@Component({
  selector: 'app-qr-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
        <div>
          <div style="font-size:0.95rem;font-weight:700;color:#111827">QR Codes</div>
          <div style="font-size:0.72rem;color:#6b7280;margin-top:2px">{{ codes().length }} codes registered</div>
        </div>
        <button class="btn-add" (click)="showCreate.set(true)" [disabled]="showCreate()">+ New QR Code</button>
      </div>

      @if (showCreate()) {
        <div class="create-form">
          <div class="cf-grid">
            <div class="cf-field">
              <label>Code *</label>
              <input [(ngModel)]="newCode" placeholder="e.g. LINE7-QR">
            </div>
            <div class="cf-field">
              <label>Type *</label>
              <select [(ngModel)]="newType">
                <option value="">Select type</option>
                <option value="line">Line</option>
                <option value="machine">Machine</option>
                <option value="section">Section</option>
                <option value="safety_poster">Safety Poster</option>
              </select>
            </div>
            <div class="cf-field" style="grid-column:1/-1">
              <label>Label *</label>
              <input [(ngModel)]="newLabel" placeholder="e.g. Line 7 — Sewing Floor">
            </div>
            <div class="cf-field">
              <label>Factory ID</label>
              <input [(ngModel)]="newFactoryId" placeholder="e.g. Factory-A">
            </div>
            <div class="cf-field">
              <label>Line ID</label>
              <input [(ngModel)]="newLineId" placeholder="e.g. Line 7">
            </div>
            <div class="cf-field">
              <label>Section ID</label>
              <input [(ngModel)]="newSectionId" placeholder="e.g. Cutting Floor">
            </div>
            <div class="cf-field">
              <label>Machine ID</label>
              <input [(ngModel)]="newMachineId" placeholder="e.g. SWM-0042">
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <button class="btn-save" (click)="create()" [disabled]="creating()">
              {{ creating() ? 'Creating…' : 'Create' }}
            </button>
            <button class="btn-cancel" (click)="cancelCreate()">Cancel</button>
          </div>
          @if (createError()) {
            <div style="color:#dc2626;font-size:0.75rem;margin-top:0.4rem">{{ createError() }}</div>
          }
        </div>
      }

      @if (loading()) {
        <div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.82rem">Loading QR codes…</div>
      }

      <div class="qr-table-wrap">
        <table class="qr-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Label</th>
              <th>Location</th>
              <th>Scans</th>
              <th>Last Scanned</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (q of codes(); track q.id) {
              <tr [class.row-inactive]="!q.isActive">
                <td><code style="font-size:0.72rem;background:#f3f4f6;padding:2px 5px;border-radius:4px">{{ q.code }}</code></td>
                <td><span class="type-pill">{{ q.qrType }}</span></td>
                <td style="font-size:0.8rem;color:#111827">{{ q.label }}</td>
                <td style="font-size:0.72rem;color:#6b7280">
                  @if (q.lineId) { <span>{{ q.lineId }}</span> }
                  @if (q.machineId) { <span> · {{ q.machineId }}</span> }
                  @if (q.sectionId) { <span>{{ q.sectionId }}</span> }
                </td>
                <td style="font-size:0.8rem;font-weight:600;color:#374151">{{ q.scanCount }}</td>
                <td style="font-size:0.72rem;color:#6b7280">
                  {{ q.lastScannedAt ? (q.lastScannedAt | date:'MMM d, HH:mm') : '—' }}
                </td>
                <td>
                  <span [class]="q.isActive ? 'status-active' : 'status-inactive'">
                    {{ q.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <button class="btn-toggle" (click)="toggle(q)">
                    {{ q.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                </td>
              </tr>
            }
            @empty {
              <tr>
                <td colspan="8" style="text-align:center;color:#9ca3af;font-size:0.8rem;padding:2rem">
                  No QR codes found.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .btn-add { padding:0.4rem 0.9rem;background:#6d28d9;color:#fff;border:none;border-radius:6px;
      font-size:0.78rem;font-weight:600;cursor:pointer; }
    .btn-add:disabled { opacity:.5;cursor:not-allowed; }
    .create-form { background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;margin-bottom:1rem; }
    .cf-grid { display:grid;grid-template-columns:1fr 1fr;gap:0.6rem; }
    .cf-field label { display:block;font-size:0.7rem;font-weight:600;color:#374151;margin-bottom:3px; }
    .cf-field input, .cf-field select { width:100%;padding:0.38rem 0.6rem;border:1px solid #d1d5db;
      border-radius:6px;font-size:0.78rem;outline:none;box-sizing:border-box; }
    .btn-save { padding:0.38rem 1rem;background:#6d28d9;color:#fff;border:none;border-radius:6px;
      font-size:0.78rem;cursor:pointer; }
    .btn-cancel { padding:0.38rem 0.9rem;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;
      border-radius:6px;font-size:0.78rem;cursor:pointer; }
    .qr-table-wrap { overflow-x:auto; }
    .qr-table { width:100%;border-collapse:collapse;font-size:0.78rem; }
    .qr-table th { background:#f9fafb;padding:0.5rem 0.75rem;text-align:left;font-size:0.67rem;
      font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;
      border-bottom:1px solid #e5e7eb; }
    .qr-table td { padding:0.6rem 0.75rem;border-bottom:1px solid #f3f4f6;vertical-align:middle; }
    .row-inactive td { opacity:.5; }
    .type-pill { font-size:0.67rem;background:#ede9fe;color:#6d28d9;padding:2px 6px;border-radius:10px;font-weight:600; }
    .status-active { font-size:0.67rem;background:#dcfce7;color:#15803d;padding:2px 6px;border-radius:10px;font-weight:600; }
    .status-inactive { font-size:0.67rem;background:#f3f4f6;color:#9ca3af;padding:2px 6px;border-radius:10px;font-weight:600; }
    .btn-toggle { font-size:0.68rem;padding:2px 8px;border:1px solid #d1d5db;background:#fff;
      border-radius:5px;cursor:pointer;color:#374151; }
    .btn-toggle:hover { background:#f3f4f6; }
  `]
})
export class QrAdminComponent implements OnInit {
  private http = inject(HttpClient);

  codes = signal<QrCodeItem[]>([]);
  loading = signal(true);
  showCreate = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);

  newCode = '';
  newType = '';
  newLabel = '';
  newFactoryId = '';
  newLineId = '';
  newSectionId = '';
  newMachineId = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<QrCodeItem[]>('/api/v1/qr').subscribe({
      next: data => { this.codes.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  cancelCreate(): void {
    this.showCreate.set(false);
    this.createError.set(null);
    this.newCode = this.newType = this.newLabel = '';
    this.newFactoryId = this.newLineId = this.newSectionId = this.newMachineId = '';
  }

  create(): void {
    if (!this.newCode.trim() || !this.newType || !this.newLabel.trim()) {
      this.createError.set('Code, type and label are required.');
      return;
    }
    this.creating.set(true);
    this.createError.set(null);
    this.http.post<{ id: string; code: string; label: string }>('/api/v1/qr', {
      code: this.newCode.trim(),
      qrType: this.newType,
      label: this.newLabel.trim(),
      factoryId: this.newFactoryId || null,
      lineId: this.newLineId || null,
      sectionId: this.newSectionId || null,
      machineId: this.newMachineId || null,
    }).subscribe({
      next: () => { this.creating.set(false); this.cancelCreate(); this.load(); },
      error: err => {
        this.creating.set(false);
        this.createError.set(err.error?.error ?? 'Failed to create QR code.');
      }
    });
  }

  toggle(qr: QrCodeItem): void {
    this.http.put(`/api/v1/qr/${qr.id}`, { isActive: !qr.isActive }).subscribe({
      next: () => this.load(),
    });
  }
}
