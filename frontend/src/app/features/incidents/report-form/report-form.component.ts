import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IncidentService, CreateIncidentRequest, ReportFormOptions } from '../incident.service';
import { OfflineSyncService } from '../offline-sync.service';
import { AuthService } from '../../../core/services/auth.service';

const INCIDENT_TYPES_FALLBACK = ['Injury', 'Chemical', 'Equipment', 'Fire Safety', 'Quality', 'Slip/Fall', 'Near Miss', 'Environmental'];
const SEVERITIES_FALLBACK = [
  { value: 1, label: 'Critical (L1)' },
  { value: 2, label: 'High (L2)' },
  { value: 3, label: 'Medium (L3)' },
  { value: 4, label: 'Low (L4)' },
];

/** Required fields validated before leaving each wizard step. */
const STEP_REQUIRED: Record<number, string[]> = {
  1: ['category', 'classificationCategory', 'factory'],
  3: ['shortDescription'],
};

const STEPS = [
  { label: 'General Info', icon: 'doc' },
  { label: 'Reporter',     icon: 'user' },
  { label: 'Details',      icon: 'list' },
  { label: 'Location',     icon: 'pin' },
  { label: 'Severity',     icon: 'alert' },
  { label: 'Attachments',  icon: 'camera' },
  { label: 'AI Summary',   icon: 'sparkles' },
  { label: 'Review',       icon: 'check' },
];

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="wiz-page">

      <!-- Top bar -->
      <div class="wiz-top-bar">
        <div>
          <div class="wiz-main-title">Report Incident</div>
          <div class="wiz-draft-line">{{ incidentRef }} &nbsp;·&nbsp; <span style="color:#9ca3af">Draft</span></div>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="router.navigate(['/my-incidents'])">Cancel</button>
      </div>

      <!-- Steps bar -->
      <div class="wiz-steps-bar">
        @for (step of STEPS; track step.label; let i = $index) {
          @if (i > 0) {
            <div class="wiz-connector" [class.wiz-connector--done]="currentStep() > i + 1"></div>
          }
          <div class="wiz-step-wrap">
            <div class="wiz-step-icon"
              [class.wiz-step-icon--active]="currentStep() === i + 1"
              [class.wiz-step-icon--done]="currentStep() > i + 1">
              @if (currentStep() > i + 1) {
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              } @else {
                @if (step.icon === 'doc') {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                }
                @if (step.icon === 'user') {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                }
                @if (step.icon === 'list') {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/>
                    <line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/>
                  </svg>
                }
                @if (step.icon === 'pin') {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                }
                @if (step.icon === 'alert') {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <path d="M12 9v4"/><path d="M12 17h.01"/>
                  </svg>
                }
                @if (step.icon === 'camera') {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                }
                @if (step.icon === 'sparkles') {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                }
                @if (step.icon === 'check') {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                }
              }
            </div>
            <div class="wiz-step-label"
              [class.wiz-step-label--active]="currentStep() === i + 1"
              [class.wiz-step-label--done]="currentStep() > i + 1">
              {{ step.label }}
            </div>
          </div>
        }
      </div>

      <!-- Content -->
      <div class="wiz-content" [formGroup]="form">
        @if (currentStep() === 1) {
          <div class="form-section-title">General Information</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Incident Number</label>
                <input type="text" class="form-control" [value]="incidentRef" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Date &amp; Time</label>
                <input type="text" class="form-control" [value]="draftDate" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Incident Type <span class="req">*</span></label>
                <select class="form-control" formControlName="category"
                  [class.is-invalid]="f['category'].invalid && f['category'].touched">
                  <option value="">Select Incident Type</option>
                  @for (t of incidentTypes(); track t) {
                    <option [value]="t">{{ t }}</option>
                  }
                </select>
                @if (f['category'].invalid && f['category'].touched) {
                  <div class="form-error">Incident type is required.</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Category <span class="req">*</span></label>
                <select class="form-control" formControlName="classificationCategory"
                  (change)="onClassificationChange()"
                  [class.is-invalid]="f['classificationCategory'].invalid && f['classificationCategory'].touched">
                  <option value="">Select Category</option>
                  @for (c of categoryOptions(); track c.name) {
                    <option [value]="c.name">{{ c.name }}</option>
                  }
                </select>
                @if (f['classificationCategory'].invalid && f['classificationCategory'].touched) {
                  <div class="form-error">Category is required.</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Sub Category</label>
                <select class="form-control" formControlName="subCategory">
                  <option value="">Select Sub Category</option>
                  @for (s of subCategoryOptions(); track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Factory <span class="req">*</span></label>
                <select class="form-control" formControlName="factory"
                  (change)="onFactoryChange()"
                  [class.is-invalid]="f['factory'].invalid && f['factory'].touched">
                  <option value="">Select Factory</option>
                  @for (f of factoryOptions(); track f.id) {
                    <option [value]="f.name">{{ f.name }}</option>
                  }
                </select>
                @if (f['factory'].invalid && f['factory'].touched) {
                  <div class="form-error">Factory is required.</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Building</label>
                <select class="form-control" formControlName="building">
                  <option value="">Select Building</option>
                  @for (b of buildingOptions(); track b) {
                    <option [value]="b">{{ b }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Floor</label>
                <select class="form-control" formControlName="floor">
                  <option value="">Select Floor</option>
                  @for (fl of floorOptions(); track fl) {
                    <option [value]="fl">{{ fl }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Line / Section</label>
                <select class="form-control" formControlName="department">
                  <option value="">Select Line / Section</option>
                  @for (ln of lineOptions(); track ln) {
                    <option [value]="ln">{{ ln }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Machine ID</label>
                <input type="text" class="form-control" formControlName="equipment" placeholder="e.g. SWM-0042">
              </div>
              <div class="form-group">
                <label class="form-label">Production Order</label>
                <input type="text" class="form-control" formControlName="productionOrder" placeholder="e.g. PO-2024-5521">
              </div>
              <div class="form-group">
                <label class="form-label">Buyer</label>
                <input type="text" class="form-control" formControlName="buyer" placeholder="e.g. H&amp;M, Zara, NEXT">
              </div>
              <div class="form-group" style="grid-column: 1 / -1">
                <label class="form-label">Style Number</label>
                <input type="text" class="form-control" formControlName="styleNumber" placeholder="e.g. STL-0024-BLK">
              </div>
            </div>
        }

        @if (currentStep() === 2) {
          <div class="form-section-title">Reporter Information</div>

          <!-- FS-24: Confidential reporting toggle -->
          <div class="conf-banner" [class.conf-banner--active]="isConfidential()">
            <div class="conf-banner-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div>
                <div class="conf-label">Report Confidentially</div>
                <div class="conf-sub">Your name will be hidden from supervisors. Only Plant Manager and Compliance Officer can view your identity.</div>
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" [checked]="isConfidential()" (change)="toggleConfidential()">
              <span class="toggle-track"></span>
            </label>
          </div>

          @if (!isConfidential()) {
            <div class="form-grid-2" style="margin-top:1rem">
              <div class="form-group">
                <label class="form-label">Reporter Name</label>
                <input type="text" class="form-control" formControlName="reporterName" placeholder="Full name">
              </div>
              <div class="form-group">
                <label class="form-label">Employee ID</label>
                <input type="text" class="form-control" formControlName="employeeId" placeholder="e.g. EMP-0042">
              </div>
              <div class="form-group">
                <label class="form-label">Department</label>
                <select class="form-control" formControlName="reporterDepartment">
                  <option value="">Select Department</option>
                  @for (d of reporterDepartments(); track d) {
                    <option [value]="d">{{ d }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Contact Number</label>
                <input type="text" class="form-control" formControlName="contactNumber" placeholder="Phone number">
              </div>
            </div>
          } @else {
            <div class="conf-masked-notice" style="margin-top:1rem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Your identity is protected. This report will be submitted with your account but your name will appear as <strong>Reporter (Confidential)</strong> to supervisors.
            </div>
          }
        }

        @if (currentStep() === 3) {
          <div class="form-section-title">Incident Details</div>
            <div class="form-group">
              <label class="form-label">Short Description <span class="req">*</span></label>
              <textarea class="form-control" formControlName="shortDescription" rows="3"
                placeholder="Briefly describe what happened…"
                [class.is-invalid]="f['shortDescription'].invalid && f['shortDescription'].touched"></textarea>
              @if (f['shortDescription'].invalid && f['shortDescription'].touched) {
                <div class="form-error">Description is required.</div>
              }
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Witnesses</label>
                <input type="text" class="form-control" formControlName="witnesses" placeholder="Names of witnesses">
              </div>
              <div class="form-group">
                <label class="form-label">Immediate Action Taken</label>
                <input type="text" class="form-control" formControlName="immediateActionTaken" placeholder="e.g. First aid administered">
              </div>
            </div>
        }

        @if (currentStep() === 4) {
          <div class="form-section-title">Location</div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Exact Location</label>
              <input type="text" class="form-control" formControlName="exactLocation" placeholder="e.g. Machine M-0042, near column B">
            </div>
            <div class="form-group">
              <label class="form-label">GPS Coordinates</label>
              <input type="text" class="form-control" formControlName="gpsCoordinates" placeholder="Optional">
            </div>
          </div>
        }

        @if (currentStep() === 5) {
          <div class="form-section-title">Severity Assessment</div>
            <div class="form-group" style="max-width:400px">
              <label class="form-label">Severity Level <span class="req">*</span></label>
              <select class="form-control" formControlName="severity">
                @for (s of severityOptions(); track s.value) {
                  <option [value]="s.value">{{ s.label }}</option>
                }
              </select>
            </div>
        }

        @if (currentStep() === 6) {
          <div class="form-section-title">Attachments</div>
          <div style="border:2px dashed #e5e7eb;border-radius:8px;padding:2.5rem 1.5rem;text-align:center;background:#fafafa">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
              style="display:block;margin:0 auto 0.75rem">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p style="color:#374151;margin:0 0 0.35rem;font-size:0.82rem;font-weight:500">
              Drag &amp; drop files here or click to browse
            </p>
            <p style="color:#9ca3af;font-size:0.72rem;margin:0 0 1rem">JPEG, PNG, PDF — max 5 MB. Selected files upload automatically when you submit.</p>
            <input type="file" accept="image/jpeg,image/png,application/pdf"
              (change)="onFileSelected($event)">
            @if (selectedFile()) {
              <p style="margin-top:0.75rem;font-size:0.8rem;color:#374151">
                {{ selectedFile()!.name }} — {{ (selectedFile()!.size / 1024).toFixed(1) }} KB
              </p>
              <button class="btn btn-secondary btn-sm" style="margin-top:0.5rem"
                (click)="uploadFile()" [disabled]="uploading()">
                {{ uploading() ? 'Uploading…' : 'Upload File' }}
              </button>
            }
            @if (uploadDone()) {
              <p style="color:#16a34a;margin-top:0.75rem;font-size:0.82rem;font-weight:600">
                ✓ {{ uploadedFileName() }} uploaded
              </p>
            }
          </div>
        }

        @if (currentStep() === 7) {
          <div class="form-section-title">AI Summary</div>
          <div style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:8px;padding:1.25rem;display:flex;gap:0.75rem;align-items:flex-start;margin-bottom:1rem">
            <div style="width:28px;height:28px;background:#7c3aed;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div style="flex:1">
              <p style="color:#4c1d95;font-size:0.82rem;margin:0 0 0.35rem;font-weight:600">AI Safety Analysis</p>
              <p style="color:#5b21b6;font-size:0.78rem;margin:0 0 0.75rem;line-height:1.6">
                Auto-generated from your report details. Edit before submitting if needed.
              </p>
              <textarea class="form-control" formControlName="aiSummary" rows="5"
                placeholder="Summary will generate when you reach this step…"></textarea>
            </div>
          </div>
        }

        @if (currentStep() === 8) {
          <div class="form-section-title">Review &amp; Submit</div>

          @if (!isOnline()) {
            <div class="alert" style="background:#fef9c3;border-color:#fde68a;color:#92400e;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
              <span>You are <strong>offline</strong>. Submitting will save this report locally and sync it when you reconnect.</span>
            </div>
          }

          @if (qrLabel()) {
            <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:#f5f3ff;border:1px solid #ede9fe;border-radius:6px;margin-bottom:1rem;font-size:0.78rem;color:#5b21b6">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2">
                <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/>
                <rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
              </svg>
              Scanned via QR: <strong>{{ qrLabel() }}</strong>
            </div>
          }

          @if (submitError()) {
            <div class="alert alert-error" style="margin-bottom:1rem">
              ⚠ {{ submitError() }}
            </div>
          }
          @if (apiError()) {
            <div class="alert alert-error">{{ apiError() }}</div>
          }
          @if (savedOffline()) {
            <div class="alert alert-success">📥 Report saved offline. It will sync automatically when you're back online.</div>
          } @else if (confirmation()) {
            <div class="alert alert-success">✓ Incident submitted! Reference: <strong>{{ confirmation() }}</strong></div>
          }
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:1.1rem">
            <div class="form-grid-2" style="gap:0.75rem 2rem">
              <div>
                <div class="review-label">Incident Type</div>
                <div class="review-value">{{ form.value.category || '—' }}</div>
              </div>
              <div>
                <div class="review-label">Category</div>
                <div class="review-value">{{ form.value.classificationCategory || '—' }}</div>
              </div>
              <div>
                <div class="review-label">Sub Category</div>
                <div class="review-value">{{ form.value.subCategory || '—' }}</div>
              </div>
              <div>
                <div class="review-label">Factory</div>
                <div class="review-value">{{ form.value.factory || '—' }}</div>
              </div>
              <div>
                <div class="review-label">Line / Section</div>
                <div class="review-value">{{ form.value.department || '—' }}</div>
              </div>
              <div>
                <div class="review-label">Severity</div>
                <div class="review-value">{{ sevLabel(form.value.severity) }}</div>
              </div>
              <div>
                <div class="review-label">Reporter</div>
                <div class="review-value">{{ isConfidential() ? 'Confidential' : (form.value.reporterName || '—') }}</div>
              </div>
              <div>
                <div class="review-label">Location</div>
                <div class="review-value">{{ form.value.exactLocation || '—' }}</div>
              </div>
              <div style="grid-column:1/-1">
                <div class="review-label">Description</div>
                <div class="review-desc">{{ form.value.shortDescription || '—' }}</div>
              </div>
              @if (form.value.aiSummary) {
                <div style="grid-column:1/-1">
                  <div class="review-label">AI Summary</div>
                  <div class="review-desc">{{ form.value.aiSummary }}</div>
                </div>
              }
              @if (selectedFile()) {
                <div style="grid-column:1/-1">
                  <div class="review-label">Attachment</div>
                  <div class="review-value">{{ selectedFile()!.name }}</div>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="wiz-footer">
        <button class="btn btn-secondary btn-sm"
          [disabled]="currentStep() === 1"
          (click)="prevStep()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:0.2rem">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Previous
        </button>
        <span class="wiz-step-indicator">Step {{ currentStep() }} of {{ STEPS.length }}</span>
        @if (stepError()) {
          <span class="wiz-step-error">{{ stepError() }}</span>
        }
        @if (currentStep() < STEPS.length) {
          <button class="btn btn-sm wiz-next-btn" (click)="nextStep()">
            Next
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:0.2rem">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        } @else {
          <button class="btn btn-sm wiz-next-btn" [disabled]="submitting()" (click)="submit()">
            {{ submitting() ? 'Submitting…' : isOnline() ? 'Submit Report' : 'Save Offline' }}
          </button>
        }
      </div>

    </div>
  `,
  styles: [`
    .conf-banner { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem;
      padding:0.9rem 1rem; border:1px solid #e5e7eb; border-radius:8px; background:#fafafa; }
    .conf-banner--active { border-color:#8b5cf6; background:#f5f3ff; }
    .conf-banner-left { display:flex; gap:0.6rem; align-items:flex-start; }
    .conf-label { font-size:0.82rem; font-weight:600; color:#111827; margin-bottom:2px; }
    .conf-sub { font-size:0.72rem; color:#6b7280; line-height:1.4; max-width:420px; }
    .toggle { position:relative; display:inline-block; width:36px; height:20px; flex-shrink:0; }
    .toggle input { opacity:0; width:0; height:0; }
    .toggle-track { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0;
      background:#d1d5db; border-radius:20px; transition:.2s; }
    .toggle-track::before { position:absolute; content:''; height:14px; width:14px;
      left:3px; bottom:3px; background:#fff; border-radius:50%; transition:.2s; }
    .toggle input:checked + .toggle-track { background:#7c3aed; }
    .toggle input:checked + .toggle-track::before { transform:translateX(16px); }
    .conf-masked-notice { display:flex; align-items:flex-start; gap:0.5rem;
      padding:0.75rem 1rem; background:#f5f3ff; border:1px solid #ede9fe; border-radius:8px;
      font-size:0.78rem; color:#5b21b6; line-height:1.5; }
    .review-label { font-size:0.65rem;font-weight:700;letter-spacing:0.06em;color:#9ca3af;text-transform:uppercase;margin-bottom:0.2rem; }
    .review-value { font-size:0.85rem;font-weight:600;color:#111827; }
    .review-desc { font-size:0.82rem;color:#374151;line-height:1.5; }
    .wiz-step-error { font-size:0.75rem;color:#dc2626;margin-left:0.5rem; }
  `]
})
export class ReportFormComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);

  readonly STEPS = STEPS;

  formOptions = signal<ReportFormOptions | null>(null);
  subCategoryOptions = signal<string[]>([]);
  lineOptions = signal<string[]>([]);
  stepError = signal<string | null>(null);
  optionsLoading = signal(true);

  incidentTypes = signal<string[]>(INCIDENT_TYPES_FALLBACK);
  categoryOptions = signal<ReportFormOptions['categories']>([]);
  factoryOptions = signal<ReportFormOptions['factories']>([]);
  buildingOptions = signal<string[]>(['Building 1', 'Building 2']);
  floorOptions = signal<string[]>(['Floor 1', 'Floor 2', 'Floor 3']);
  reporterDepartments = signal<string[]>([]);
  severityOptions = signal<{ value: number; label: string }[]>(SEVERITIES_FALLBACK);

  currentStep = signal(1);
  isConfidential = signal(false);
  isOnline = signal(navigator.onLine);
  savedOffline = signal(false);
  qrCodeId = signal<string | null>(null);
  qrLabel = signal<string | null>(null);

  incidentRef = 'Draft';
  draftDate = new Date().toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  private readonly incidentOccurredAt = new Date().toISOString();

  confirmation = signal<string | null>(null);
  confirmedIncidentId = signal<string | null>(null);
  submitting = signal(false);
  apiError = signal<string | null>(null);
  submitError = signal<string | null>(null);

  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  uploadDone = signal(false);
  uploadedFileName = signal<string | null>(null);

  form: FormGroup;

  private onlineHandler = () => this.isOnline.set(true);
  private offlineHandler = () => this.isOnline.set(false);

  constructor(
    private fb: FormBuilder,
    private incidentService: IncidentService,
    private offlineSync: OfflineSyncService,
    public router: Router
  ) {
    this.form = this.fb.group({
      category:               ['', Validators.required],
      classificationCategory: ['', Validators.required],
      subCategory:            [''],
      factory:                ['', Validators.required],
      building:               [''],
      floor:                  [''],
      department:             [''],
      equipment:              [''],
      productionOrder:        [''],
      buyer:                  [''],
      styleNumber:            [''],
      reporterName:           [''],
      employeeId:             [''],
      reporterDepartment:     [''],
      contactNumber:          [''],
      shortDescription:       ['', Validators.required],
      witnesses:              [''],
      immediateActionTaken:   [''],
      exactLocation:          [''],
      gpsCoordinates:         [''],
      severity:               [4],
      aiSummary:              [''],
    });

    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { qrContext?: { qrCodeId: string; label: string; department?: string; machineId?: string } } | undefined;
    if (state?.qrContext) {
      const ctx = state.qrContext;
      this.qrCodeId.set(ctx.qrCodeId);
      this.qrLabel.set(ctx.label);
      this.form.patchValue({
        department: ctx.department ?? '',
        equipment: ctx.machineId ?? '',
      });
    }
  }

  ngOnInit(): void {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    const displayName = this.auth.currentName() ?? this.auth.currentEmail()?.split('@')[0] ?? '';
    this.form.patchValue({ reporterName: displayName });

    this.incidentService.getReportFormOptions().subscribe({
      next: opts => {
        this.formOptions.set(opts);
        this.incidentTypes.set(opts.incidentTypes.length ? opts.incidentTypes : INCIDENT_TYPES_FALLBACK);
        this.categoryOptions.set(opts.categories);
        this.factoryOptions.set(opts.factories);
        this.buildingOptions.set(opts.buildings);
        this.floorOptions.set(opts.floors);
        this.reporterDepartments.set(opts.reporterDepartments);
        this.severityOptions.set(
          opts.severityLevels.length
            ? opts.severityLevels.map(s => ({ value: s.value, label: s.label }))
            : SEVERITIES_FALLBACK
        );
        this.optionsLoading.set(false);

        const factoryName = this.auth.currentFactoryName();
        if (factoryName && opts.factories.some(f => f.name === factoryName)) {
          this.form.patchValue({ factory: factoryName });
        } else if (opts.factories.length === 1) {
          this.form.patchValue({ factory: opts.factories[0].name });
        }
        this.onFactoryChange();
        this.onClassificationChange();
      },
      error: () => {
        this.optionsLoading.set(false);
        this.onFactoryChange();
      },
    });
  }

  onClassificationChange(): void {
    const name = this.form.value.classificationCategory as string;
    const cat = this.categoryOptions().find(c => c.name === name);
    this.subCategoryOptions.set(cat?.subcategories ?? []);
    if (!this.subCategoryOptions().includes(this.form.value.subCategory)) {
      this.form.patchValue({ subCategory: '' });
    }
  }

  onFactoryChange(): void {
    const name = this.form.value.factory as string;
    const factory = this.factoryOptions().find(f => f.name === name);
    this.lineOptions.set(factory?.lines ?? []);
    if (this.form.value.department && !this.lineOptions().includes(this.form.value.department)) {
      this.form.patchValue({ department: '' });
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  get f() { return this.form.controls; }

  toggleConfidential(): void {
    this.isConfidential.update(v => !v);
  }

  nextStep(): void {
    this.stepError.set(null);
    if (!this.validateStep(this.currentStep())) return;

    const next = this.currentStep() + 1;
    if (next === 7) {
      this.generateAiSummary();
    }
    if (this.currentStep() < this.STEPS.length) {
      this.currentStep.set(next);
    }
  }

  prevStep(): void {
    this.stepError.set(null);
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  private validateStep(step: number): boolean {
    const fields = STEP_REQUIRED[step];
    if (!fields?.length) return true;

    let valid = true;
    for (const name of fields) {
      const ctrl = this.f[name];
      ctrl.markAsTouched();
      if (ctrl.invalid) valid = false;
    }

    if (!valid) {
      const labels: Record<string, string> = {
        category: 'Incident Type',
        classificationCategory: 'Category',
        factory: 'Factory',
        shortDescription: 'Short Description',
      };
      const missing = fields.filter(n => this.f[n].invalid).map(n => labels[n] ?? n);
      this.stepError.set(`Please complete: ${missing.join(', ')}`);
    }
    return valid;
  }

  sevLabel(v: number): string {
    return this.severityOptions().find(s => s.value === Number(v))?.label ?? '—';
  }

  submit(): void {
    this.submitError.set(null);
    this.stepError.set(null);
    if (!this.validateStep(1) || !this.validateStep(3)) {
      this.submitError.set('Please complete all required fields before submitting.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const missing: string[] = [];
      if (this.f['category'].invalid) missing.push('Incident Type (Step 1)');
      if (this.f['classificationCategory'].invalid) missing.push('Category (Step 1)');
      if (this.f['factory'].invalid) missing.push('Factory (Step 1)');
      if (this.f['shortDescription'].invalid) missing.push('Short Description (Step 3)');
      this.submitError.set('Please fill in required fields: ' + missing.join(', '));
      return;
    }

    if (!this.form.value.aiSummary) {
      this.generateAiSummary();
    }

    const payload = this.buildPayload();

    if (!this.isOnline()) {
      this.offlineSync.saveDraft({
        ...payload,
        isConfidential: this.isConfidential(),
      }).then(() => {
        this.savedOffline.set(true);
        this.confirmation.set('Saved offline — will sync when online');
      });
      return;
    }

    this.submitting.set(true);
    this.apiError.set(null);

    this.incidentService.createIncident(payload).subscribe({
      next: res => {
        this.incidentRef = res.incident_reference;
        this.confirmation.set(res.incident_reference);
        this.confirmedIncidentId.set(res.incident_id);
        this.submitting.set(false);
        this.uploadPendingAttachment(res.incident_id);
        setTimeout(() => this.router.navigate(['/incidents', res.incident_reference]), 2500);
      },
      error: err => {
        const msg = err.error?.errors
          ? Object.values(err.error.errors).flat().join(' ')
          : (err.error?.message ?? 'Submission failed. Please try again.');
        this.apiError.set(msg as string);
        this.submitting.set(false);
      }
    });
  }

  private buildPayload(): CreateIncidentRequest {
    const v = this.form.value;
    const confidential = this.isConfidential();
    const payload: CreateIncidentRequest = {
      category: v.category || 'Injury',
      shortDescription: v.shortDescription || 'Incident reported via wizard.',
      severity: Number(v.severity),
      department: v.department || undefined,
      isConfidential: confidential,
      incidentOccurredAt: this.incidentOccurredAt,
      classificationCategory: v.classificationCategory || undefined,
      subCategory: v.subCategory || undefined,
      factory: v.factory || undefined,
      building: v.building || undefined,
      floor: v.floor || undefined,
      equipment: v.equipment || undefined,
      productionOrder: v.productionOrder || undefined,
      buyer: v.buyer || undefined,
      styleNumber: v.styleNumber || undefined,
      witnesses: v.witnesses || undefined,
      immediateActionTaken: v.immediateActionTaken || undefined,
      exactLocation: v.exactLocation || undefined,
      gpsCoordinates: v.gpsCoordinates || undefined,
      aiSummary: v.aiSummary || undefined,
    };

    const qrId = this.qrCodeId();
    if (qrId) {
      payload.qrCodeId = qrId;
    }

    if (!confidential) {
      payload.reporterName = v.reporterName || undefined;
      payload.employeeId = v.employeeId || undefined;
      payload.reporterDepartment = v.reporterDepartment || undefined;
      payload.contactNumber = v.contactNumber || undefined;
    }

    return payload;
  }

  private generateAiSummary(): void {
    const v = this.form.value;
    const parts = [
      `${v.category || 'Incident'} reported at ${v.factory || 'the facility'}`,
      v.department ? `Line/Section: ${v.department}` : null,
      v.equipment ? `Equipment: ${v.equipment}` : null,
      v.exactLocation ? `Location: ${v.exactLocation}` : null,
      v.shortDescription ? `Description: ${v.shortDescription}` : null,
      v.immediateActionTaken ? `Immediate action: ${v.immediateActionTaken}` : null,
      v.witnesses ? `Witnesses: ${v.witnesses}` : null,
      `Severity: ${this.sevLabel(v.severity)}.`,
    ].filter(Boolean);

    this.form.patchValue({
      aiSummary: parts.join('. ') + ' Recommended: open investigation and verify corrective controls.',
    });
  }

  private uploadPendingAttachment(incidentId: string): void {
    const file = this.selectedFile();
    if (!file || this.uploadDone()) return;
    this.uploading.set(true);
    this.incidentService.uploadAttachment(incidentId, file).subscribe({
      next: () => {
        this.uploadDone.set(true);
        this.uploadedFileName.set(file.name);
        this.uploading.set(false);
      },
      error: () => { this.uploading.set(false); },
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    this.uploadDone.set(false);
  }

  uploadFile(): void {
    const incidentId = this.confirmedIncidentId();
    if (!incidentId) {
      this.apiError.set('Submit the report first, then upload attachments — or submit with a file selected and it will upload automatically.');
      return;
    }
    this.uploadPendingAttachment(incidentId);
  }
}
