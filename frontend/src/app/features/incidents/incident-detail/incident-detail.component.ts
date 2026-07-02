import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IncidentService, IncidentDetail, ActionsSummary, IncidentAttachment, Resolver } from '../incident.service';
import { ApprovalAuditTrailPanelComponent } from '../../approver/approval-audit-trail-panel.component';
import { TimelinePanelComponent } from '../../governance/timeline-panel.component';
import { GovernanceService, TimelineEntry } from '../../governance/governance.service';
import { InvestigationService, InvestigationWorkspace } from '../../resolver/investigation.service';
import { RcaService, RcaDto } from '../../resolver/rca/rca.service';
import { RecentIncidentService } from '../../../core/services/recent-incident.service';
import { AuthService } from '../../../core/services/auth.service';

interface IncidentTab {
  id: string;
  label: string;
}

const TAB_ITEMS: IncidentTab[] = [
  { id: 'Overview', label: 'Overview' },
  { id: 'Timeline', label: 'Timeline' },
  { id: 'Investigation', label: 'Investigation' },
  { id: 'Root Cause', label: 'Root Cause' },
  { id: 'Corrective Actions', label: 'Corrective Actions' },
  { id: 'Attachments', label: 'Attachments' },
  { id: 'Comments', label: 'Comments' },
  { id: 'History', label: 'History' },
  { id: 'Audit Log', label: 'Audit' },
];

const GOVERNANCE_ROLES = new Set([
  'APPROVER', 'ADMIN',
]);

const APPROVER_ACTION_STATUSES = new Set(['Submitted', 'Pending Reporter Input']);

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ApprovalAuditTrailPanelComponent, TimelinePanelComponent,
  ],
  template: `
    <div class="inc-page">

      @if (loading()) {
        <div class="inc-state">Loading incident…</div>
      } @else if (error()) {
        <div class="inc-state inc-state--err">{{ error() }}</div>
      } @else if (incident()) {

        <!-- ── Page Header ── -->
        <div class="inc-hd">
          <div class="inc-hd-left">
            <button class="inc-back" (click)="goBack()" title="Back" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <div class="inc-hd-text">
              <div class="inc-hd-row">
                <span class="inc-hd-ref">{{ incident()!.incidentReference }}</span>
                <span [class]="'sev-pill sev-pill--' + severityKey()">{{ severityLabel() }}</span>
                <span [class]="'stat-pill stat-pill--' + statusKey()">{{ incident()!.displayStatus }}</span>
              </div>
              <div class="inc-hd-sub">
                {{ incident()!.shortDescription }}
                @if (incident()!.department) {
                  <span class="inc-hd-sub-sep">—</span>
                  <span class="inc-hd-sub-dept">{{ incident()!.department }}</span>
                }
              </div>
            </div>
          </div>
          <div class="inc-hd-actions">
            @if (canEdit()) {
              <button type="button" class="btn-secondary btn-sm inc-btn-edit" (click)="showEditPanel.set(!showEditPanel())">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                </svg>
                Edit
              </button>
            }
            @if (canClose()) {
              <button type="button" class="btn-primary btn-sm inc-btn-close" [disabled]="actionPending()" (click)="closeIncident()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                {{ actionPending() ? 'Closing…' : 'Close Incident' }}
              </button>
            }
          </div>
        </div>

        @if (actionMessage()) {
          <div [class]="'alert ' + (actionMessage()!.ok ? 'alert-success' : 'alert-error')">
            {{ actionMessage()!.text }}
          </div>
        }

        @if (showEditPanel() && canEdit()) {
          <div class="card inc-edit-card">
            <div class="form-label">Edit classification</div>
            <label class="form-label">Category</label>
            <input class="form-control" [(ngModel)]="editCategory">
            <label class="form-label" style="margin-top:12px">Severity</label>
            <select class="form-control" [(ngModel)]="editSeverity">
              <option [ngValue]="1">Critical</option>
              <option [ngValue]="2">High</option>
              <option [ngValue]="3">Medium</option>
              <option [ngValue]="4">Low</option>
            </select>
            <label class="form-label" style="margin-top:12px">Reason</label>
            <textarea class="form-control" rows="2" [(ngModel)]="editReason" placeholder="Min 10 characters…"></textarea>
            <div class="inc-edit-actions">
              <button type="button" class="btn-secondary btn-sm" (click)="showEditPanel.set(false)">Cancel</button>
              <button type="button" class="btn-primary btn-sm" [disabled]="actionPending() || editReason.length < 10"
                (click)="saveEdit()">Save</button>
            </div>
          </div>
        }

        <div class="inc-layout">
          <div class="inc-col-left">

            <!-- Summary -->
            <section class="card inc-summary">
              <div class="section-title">SUMMARY</div>

              <div class="sum-row">
                <svg class="sum-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                <div class="sum-body">
                  <div class="sum-label">SEVERITY</div>
                  <div [class]="'sum-value sum-sev--' + severityKey()">{{ severityLabel() }}</div>
                </div>
              </div>

              <div class="sum-row">
                <svg class="sum-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div class="sum-body">
                  <div class="sum-label">REPORTED</div>
                  <div class="sum-value">{{ formatDate(incident()!.createdAt) }}</div>
                </div>
              </div>

              <div class="sum-row">
                <svg class="sum-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <div class="sum-body">
                  <div class="sum-label">REPORTER</div>
                  <div class="sum-value">{{ unmaskedEmail() ?? incident()!.reporterDisplay ?? '—' }}</div>
                  @if (canUnmask() && !unmaskedEmail()) {
                    <button type="button" class="inc-unmask-btn" [disabled]="unmaskBusy()" (click)="unmaskReporter()">Unmask identity</button>
                  }
                </div>
              </div>

              <div class="sum-row">
                <svg class="sum-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <div class="sum-body">
                  <div class="sum-label">LOCATION</div>
                  <div class="sum-value">{{ incident()!.department ?? '—' }}</div>
                </div>
              </div>

              <div class="sum-row">
                <svg class="sum-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                <div class="sum-body">
                  <div class="sum-label">ASSIGNED TO</div>
                  <div class="sum-value sum-value--assignee">{{ incident()!.assignedTo ?? 'Unassigned' }}</div>
                </div>
              </div>

              <div class="sum-row sum-row--last">
                <svg class="sum-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div class="sum-body">
                  <div class="sum-label">DUE DATE</div>
                  <div class="sum-value sum-value--due">{{ slaDueLabel() }}</div>
                </div>
              </div>
            </section>

            <!-- Resolution Progress -->
            <section class="card inc-progress">
              <div class="section-title">RESOLUTION PROGRESS</div>
              <ol class="inc-timeline">
                @for (step of resolutionSteps(); track step.label; let last = $last) {
                  <li class="inc-tl-item" [class.inc-tl-item--done]="step.done">
                    <span class="inc-tl-bullet">
                      @if (step.done) {
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      }
                    </span>
                    @if (!last) { <span class="inc-tl-line"></span> }
                    <span class="inc-tl-label">{{ step.label }}</span>
                  </li>
                }
              </ol>
            </section>

            <!-- Approval Actions -->
            <section class="card approval-card">
              <h3 class="approval-card__title">APPROVAL</h3>

              @if (!showApprovePicker()) {
                <div class="approval-card__row">
                  <button type="button" class="approval-btn approval-btn--approve"
                    [disabled]="!showApproverPanel() || actionPending()" (click)="openApprovePicker()">
                    Approve
                  </button>
                  <button type="button" class="approval-btn approval-btn--reject"
                    [disabled]="!showApproverPanel() || actionPending()" (click)="rejectIncident()">
                    Reject
                  </button>
                </div>
                <button type="button" class="approval-btn approval-btn--revision"
                  [disabled]="!showApproverPanel() || actionPending()" (click)="requestRevision()">
                  Request Revision
                </button>
              } @else {
                <label class="form-label">Assign to resolver</label>
                @if (resolversLoading()) {
                  <p class="inc-state" style="padding:8px 0">Loading resolvers…</p>
                } @else if (resolvers().length === 0) {
                  <p class="inc-state inc-state--err" style="padding:8px 0">No resolvers available.</p>
                } @else {
                  <select class="form-control" [(ngModel)]="selectedResolverId">
                    <option value="" disabled>Select a resolver…</option>
                    @for (r of resolvers(); track r.id) {
                      <option [value]="r.id">{{ r.name }} — {{ r.email }}</option>
                    }
                  </select>
                }
                <div class="inc-edit-actions">
                  <button type="button" class="btn-secondary btn-sm" (click)="showApprovePicker.set(false)">Cancel</button>
                  <button type="button" class="btn-primary btn-sm" [disabled]="!selectedResolverId || actionPending()"
                    (click)="approveIncident()">{{ actionPending() ? 'Approving…' : 'Confirm Approve' }}</button>
                </div>
              }
            </section>

            @if (canProvideInfo()) {
              <section class="card inc-provide">
                <div class="section-title">RESPOND TO APPROVER</div>
                <textarea rows="3" class="form-control" [(ngModel)]="provideInfoText" placeholder="Your response…"></textarea>
                <button type="button" class="btn-primary btn-sm inc-provide-btn" [disabled]="!provideInfoText.trim() || actionPending()"
                  (click)="submitProvideInfo()">Submit Response</button>
              </section>
            }

          </div>

          <div class="inc-col-right">
            <div class="inc-tabs" role="tablist">
              @for (tab of tabItems; track tab.id) {
                <button type="button" role="tab"
                  [class]="'inc-tab ' + (activeTab === tab.id ? 'inc-tab--active' : '')"
                  [attr.aria-selected]="activeTab === tab.id"
                  (click)="selectTab(tab.id)">
                  <span class="inc-tab-icon" [innerHTML]="tabIconSvg(tab.id)"></span>
                  <span class="inc-tab-label">{{ tab.label }}</span>
                </button>
              }
            </div>

            <div class="inc-tab-content">
              @if (activeTab === 'Overview') {
                <div class="inc-overview-grid">
                  <div class="inc-info-cell">
                    <div class="inc-info-label">Incident Type</div>
                    <div class="inc-info-value">{{ incident()!.category }}</div>
                  </div>
                  <div class="inc-info-cell">
                    <div class="inc-info-label">Category</div>
                    <div class="inc-info-value">{{ incident()!.category }}</div>
                  </div>
                  <div class="inc-info-cell">
                    <div class="inc-info-label">Sub-Category</div>
                    <div class="inc-info-value">{{ incident()!.category }}</div>
                  </div>
                  <div class="inc-info-cell">
                    <div class="inc-info-label">Production Order</div>
                    <div class="inc-info-value">—</div>
                  </div>
                  <div class="inc-info-cell">
                    <div class="inc-info-label">Buyer</div>
                    <div class="inc-info-value">—</div>
                  </div>
                  <div class="inc-info-cell">
                    <div class="inc-info-label">Style</div>
                    <div class="inc-info-value">—</div>
                  </div>
                  <div class="inc-info-cell">
                    <div class="inc-info-label">Affected Quantity</div>
                    <div class="inc-info-value">—</div>
                  </div>
                  <div class="inc-info-cell">
                    <div class="inc-info-label">Estimated Loss</div>
                    <div class="inc-info-value">—</div>
                  </div>
                </div>

                <div class="card inc-desc-card">
                  <div class="inc-desc-title">Description</div>
                  <p class="inc-desc-text">{{ incident()!.shortDescription }}</p>
                </div>

                <div class="card inc-impact-card">
                  <div class="inc-impact-title">Immediate Impact</div>
                  <p class="inc-impact-text">
                    @if (incident()!.rejectReason) {
                      {{ incident()!.rejectReason }}
                    } @else {
                      Investigation is in progress. Production and operational impact are being assessed and will be documented once the investigation is complete.
                    }
                  </p>
                </div>
              }

              @if (activeTab === 'Timeline') {
                <app-timeline-panel [incidentId]="incident()!.id" />
              }

              @if (activeTab === 'Investigation') {
                @if (investigationLoading()) {
                  <div class="tab-empty">Loading investigation…</div>
                } @else if (investigationError()) {
                  <div class="tab-empty">{{ investigationError() }}</div>
                  @if (auth.currentRole() === 'RESOLVER') {
                    <button type="button" class="inc-link-btn" (click)="openInvestigationWorkspace()">Open investigation workspace →</button>
                  }
                } @else if (investigation()) {
                  <div class="tab-card">
                    <div class="tab-row"><span class="tab-k">Owner</span><span>{{ investigation()!.owner ?? '—' }}</span></div>
                    <div class="tab-row"><span class="tab-k">Risk level</span><span>{{ investigation()!.riskLevel ?? '—' }}</span></div>
                    <div class="tab-row"><span class="tab-k">Opened</span><span>{{ formatDate(investigation()!.openedAt) }}</span></div>
                    @if (investigation()!.findingsSummary) {
                      <div class="tab-block"><div class="tab-k">Findings</div><p>{{ investigation()!.findingsSummary }}</p></div>
                    }
                    @if (investigation()!.notes) {
                      <div class="tab-block"><div class="tab-k">Notes</div><p>{{ investigation()!.notes }}</p></div>
                    }
                    @if (investigation()!.immediateActionTaken) {
                      <div class="tab-block"><div class="tab-k">Immediate action</div><p>{{ investigation()!.immediateActionTaken }}</p></div>
                    }
                    <div class="tab-checklist">
                      <div class="tab-k">Checklist ({{ completedChecklist() }}/{{ investigation()!.checklistItems.length }})</div>
                      @for (item of investigation()!.checklistItems; track item.id) {
                        <div class="tab-check-item">
                          <span [class]="item.isCompleted ? 'chk done' : 'chk'">{{ item.isCompleted ? '✓' : '○' }}</span>
                          {{ item.label }}
                        </div>
                      }
                    </div>
                    @if (auth.currentRole() === 'RESOLVER') {
                      <button type="button" class="inc-link-btn" (click)="openInvestigationWorkspace()">Open full workspace →</button>
                    }
                  </div>
                } @else {
                  <div class="tab-empty">No investigation opened yet.</div>
                }
              }

              @if (activeTab === 'Root Cause') {
                @if (rcaLoading()) {
                  <div class="tab-empty">Loading root cause analysis…</div>
                } @else if (rcaError()) {
                  <div class="tab-empty">{{ rcaError() }}</div>
                } @else if (rca()) {
                  <div class="tab-card">
                    <div class="tab-row"><span class="tab-k">Status</span><span>{{ rca()!.status }}</span></div>
                    <div class="tab-row"><span class="tab-k">Method</span><span>{{ rca()!.method ?? '—' }}</span></div>
                    @if (rca()!.problemStatement) {
                      <div class="tab-block"><div class="tab-k">Problem</div><p>{{ rca()!.problemStatement }}</p></div>
                    }
                    @if (rca()!.rootCauseStatement) {
                      <div class="tab-block"><div class="tab-k">Root cause</div><p>{{ rca()!.rootCauseStatement }}</p></div>
                    }
                    @if (rca()!.whyEntries.length) {
                      <div class="tab-block">
                        <div class="tab-k">5 Whys</div>
                        @for (w of rca()!.whyEntries; track w.order) {
                          <div class="why-line"><strong>Why {{ w.order }}:</strong> {{ w.text }}</div>
                        }
                      </div>
                    }
                    @if (auth.currentRole() === 'RESOLVER') {
                      <button type="button" class="inc-link-btn" (click)="openRcaWorkspace()">Open RCA workspace →</button>
                    }
                  </div>
                } @else {
                  <div class="tab-empty">No root cause analysis recorded.</div>
                }
              }

              @if (activeTab === 'Corrective Actions') {
                @if (actionsSummary()) {
                  <div class="capa-summary">
                    <div class="capa-stat"><span class="capa-stat-val">{{ actionsSummary()!.totalActions }}</span><span class="capa-stat-lbl">Total</span></div>
                    <div class="capa-stat"><span class="capa-stat-val">{{ actionsSummary()!.open }}</span><span class="capa-stat-lbl">Open</span></div>
                    <div class="capa-stat"><span class="capa-stat-val">{{ actionsSummary()!.inProgress }}</span><span class="capa-stat-lbl">In Progress</span></div>
                    <div class="capa-stat"><span class="capa-stat-val">{{ actionsSummary()!.completed }}</span><span class="capa-stat-lbl">Completed</span></div>
                    <div class="capa-stat"><span class="capa-stat-val">{{ actionsSummary()!.overallPercentage }}%</span><span class="capa-stat-lbl">Overall</span></div>
                  </div>
                  @if (auth.currentRole() === 'RESOLVER') {
                    <button type="button" class="inc-link-btn" (click)="openCapaWorkspace()">Manage CAPA →</button>
                  }
                } @else {
                  <div class="tab-empty">No corrective actions recorded.</div>
                }
              }

              @if (activeTab === 'Attachments') {
                @if (attachmentsLoading()) {
                  <div class="tab-empty">Loading attachments…</div>
                } @else if (attachments().length === 0) {
                  <div class="tab-empty">No attachments uploaded.</div>
                } @else {
                  <div class="att-list">
                    @for (a of attachments(); track a.id) {
                      <div class="att-row">
                        <div class="att-body">
                          <div class="att-name">{{ attachmentName(a) }}</div>
                          <div class="att-meta">{{ a.mimeType }} · {{ formatDate(a.uploadedAt) }}</div>
                        </div>
                      </div>
                    }
                  </div>
                }
              }

              @if (activeTab === 'Comments') {
                @if (timelineLoading()) {
                  <div class="tab-empty">Loading comments…</div>
                } @else if (timelineError()) {
                  <div class="tab-empty">{{ timelineError() }}</div>
                } @else if (commentEntries().length === 0) {
                  <div class="tab-empty">No comments or decisions recorded.</div>
                } @else {
                  <div class="comment-list">
                    @for (e of commentEntries(); track e.id) {
                      <div class="comment-row">
                        <div class="comment-hd">
                          <span class="comment-type">{{ e.eventType }}</span>
                          <span class="comment-time">{{ e.createdAt | date:'yyyy-MM-dd HH:mm' }}</span>
                        </div>
                        @if (e.description) { <p class="comment-text">{{ e.description }}</p> }
                        <div class="comment-meta">{{ e.actorEmail ?? 'System' }} · {{ e.actorRole ?? '—' }}</div>
                      </div>
                    }
                  </div>
                }
              }

              @if (activeTab === 'History') {
                @if (timelineLoading()) {
                  <div class="tab-empty">Loading history…</div>
                } @else if (timelineError()) {
                  <div class="tab-empty">{{ timelineError() }}</div>
                } @else if (historyEntries().length === 0) {
                  <div class="tab-empty">No status history recorded.</div>
                } @else {
                  <div class="history-list">
                    @for (e of historyEntries(); track e.id) {
                      <div class="history-row">
                        <div class="history-states">
                          @if (e.fromStatus) { <span>{{ e.fromStatus }}</span> }
                          @if (e.toStatus) { <span class="history-arrow">→</span><span class="history-to">{{ e.toStatus }}</span> }
                        </div>
                        @if (e.description) { <p class="comment-text">{{ e.description }}</p> }
                        <div class="comment-meta">{{ e.createdAt | date:'yyyy-MM-dd HH:mm' }} · {{ e.actorEmail ?? 'System' }}</div>
                      </div>
                    }
                  </div>
                }
              }

              @if (activeTab === 'Audit Log') {
                <app-approval-audit-trail-panel [incidentId]="incident()!.id" />
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ── Page shell ── */
    .inc-page {
      background:#F3F3F5;
      min-height:100vh;
      padding:20px 28px 36px;
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      color:#030213;
      font-size:12.25px;
      line-height:17.5px;
    }
    .inc-state { padding:3rem; text-align:center; color:#717182; font-size:12.25px; }
    .inc-state--err { color:#D4183D; }

    /* ── Header ── */
    .inc-hd { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:16px; }
    .inc-hd-left { display:flex; align-items:flex-start; gap:14px; min-width:0; }
    .inc-back {
      width:32px; height:32px; border-radius:6px;
      display:inline-flex; align-items:center; justify-content:center;
      background:transparent; border:1px solid #E9EBEF; color:#030213; cursor:pointer;
      margin-top:2px;
    }
    .inc-back:hover { background:#ECECF0; }
    .inc-back:focus-visible { outline:2px solid #D4183D; outline-offset:2px; }
    .inc-hd-text { display:flex; flex-direction:column; gap:4px; min-width:0; }
    .inc-hd-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .inc-hd-ref { font-size:21px; font-weight:700; line-height:28px; color:#030213; }
    .inc-hd-sub { font-size:12.25px; color:#717182; }
    .inc-hd-sub-sep { margin:0 6px; color:#CBCED4; }
    .inc-hd-sub-dept { color:#717182; }
    .inc-hd-actions { display:flex; gap:8px; flex-shrink:0; }
    .inc-btn-edit { display:inline-flex; align-items:center; gap:6px; }
    .inc-btn-close { display:inline-flex; align-items:center; gap:6px; }

    /* ── Pills ── */
    .sev-pill, .stat-pill {
      display:inline-flex; align-items:center;
      padding:3px 10px; border-radius:24px;
      font-size:10.5px; font-weight:600; line-height:14px; white-space:nowrap;
    }
    .sev-pill--critical { background:#FEF2F2; color:#DC2626; }
    .sev-pill--high     { background:#FFF7ED; color:#C2410C; }
    .sev-pill--medium   { background:#FFFBEB; color:#D97706; }
    .sev-pill--low      { background:#F0FDF4; color:#16A34A; }
    .stat-pill--open       { background:#FEF2F2; color:#DC2626; }
    .stat-pill--inprogress { background:#EFF6FF; color:#2563EB; }
    .stat-pill--closed     { background:#F0FDF4; color:#16A34A; }
    .stat-pill--resolved   { background:#F0FDF4; color:#16A34A; }
    .stat-pill--rejected   { background:#F3F4F6; color:#374151; }
    .stat-pill--pending-reporter-input { background:#FFFBEB; color:#D97706; }
    .stat-pill--submitted  { background:#FEF2F2; color:#DC2626; }

    /* ── Layout columns ── */
    .inc-layout {
      display:grid;
      grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
      gap:18px;
      align-items:flex-start;
    }
    @media (max-width: 1023px) {
      .inc-layout { grid-template-columns: 1fr; }
    }
    .inc-col-left { display:flex; flex-direction:column; gap:16px; min-width:0; }
    .inc-col-right { display:flex; flex-direction:column; gap:14px; min-width:0; }

    /* ── Cards (design-system token replacement) ── */
    .card {
      background:#FFFFFF;
      border:1px solid #E9EBEF;
      border-radius:8.75px;
      padding:16px;
      box-shadow:rgba(0,0,0,0.05) 0px 1px 2px 0px;
    }
    .section-title {
      font-size:10.5px; font-weight:700; letter-spacing:0.06em;
      text-transform:uppercase; color:#717182; margin-bottom:12px;
    }

    /* ── Summary ── */
    .inc-summary .section-title, .inc-progress .section-title,
    .inc-provide .section-title { margin-bottom:14px; }

    .sum-row {
      display:flex; align-items:flex-start; gap:12px;
      padding:10px 0;
      border-bottom:1px solid #ECECF0;
    }
    .sum-row--last { border-bottom:none; }
    .sum-icon { width:16px; height:16px; color:#717182; flex-shrink:0; margin-top:2px; }
    .sum-body { display:flex; flex-direction:column; gap:2px; min-width:0; }
    .sum-label {
      font-size:10.5px; font-weight:700; letter-spacing:0.06em;
      text-transform:uppercase; color:#717182;
    }
    .sum-value { font-size:12.25px; font-weight:600; color:#030213; }
    .sum-sev--critical { color:#DC2626; }
    .sum-sev--high     { color:#C2410C; }
    .sum-sev--medium   { color:#D97706; }
    .sum-sev--low      { color:#16A34A; }
    .sum-value--assignee { color:#2563EB; }
    .sum-value--due { color:#DC2626; }
    .inc-unmask-btn {
      margin-top:6px; padding:3px 8px; font-size:10.5px; font-weight:500;
      border:1px solid #CBCED4; border-radius:4px;
      background:#FFFFFF; color:#030213; cursor:pointer; align-self:flex-start;
    }
    .inc-unmask-btn:hover { background:#F3F3F5; }

    /* ── Resolution Progress ── */
    .inc-timeline { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; }
    .inc-tl-item {
      position:relative; display:grid;
      grid-template-columns:22px 1fr;
      column-gap:12px;
      padding:0 0 14px;
    }
    .inc-tl-item--last, .inc-tl-item:last-child { padding-bottom:0; }
    .inc-tl-bullet {
      width:18px; height:18px; border-radius:50%;
      background:#FFFFFF; border:1.5px solid #CBCED4;
      display:inline-flex; align-items:center; justify-content:center;
      z-index:1;
    }
    .inc-tl-item--done .inc-tl-bullet {
      background:#16A34A; border-color:#16A34A;
    }
    .inc-tl-line {
      position:absolute; left:8.5px; top:20px; bottom:0;
      width:1.5px; background:#E9EBEF;
    }
    .inc-tl-label {
      font-size:12.25px; font-weight:500; color:#717182;
      padding-top:1px;
    }
    .inc-tl-item--done .inc-tl-label { color:#16A34A; font-weight:600; }

    /* ── Approval card ── */
    .approval-card {
      border-radius:10px;
      padding:14px;
      border:1px solid #e5e7eb;
      box-shadow:0 1px 3px rgba(0,0,0,.05);
    }
    .approval-card__title {
      font-size:10.5px;
      font-weight:700;
      color:#6b7280;
      text-transform:uppercase;
      letter-spacing:.05em;
      margin:0 0 10px;
      line-height:1.2;
    }
    .approval-card__row {
      display:flex;
      gap:8px;
      margin-bottom:8px;
    }
    .approval-btn {
      height:34px;
      border-radius:8px;
      border:1px solid #d1d5db;
      background:#fff;
      color:#374151;
      font-size:13px;
      font-weight:600;
      font-family:inherit;
      cursor:pointer;
      transition:background .15s, border-color .15s, opacity .15s;
    }
    .approval-btn:disabled {
      opacity:.45;
      cursor:not-allowed;
    }
    .approval-btn--approve,
    .approval-btn--reject {
      flex:1;
    }
    .approval-btn--approve {
      background:#16a34a;
      color:#fff;
      border:none;
    }
    .approval-btn--approve:hover:not(:disabled) { background:#15803d; }
    .approval-btn--reject {
      color:#b91c1c;
      border-color:#fecaca;
    }
    .approval-btn--reject:hover:not(:disabled) { background:#fef2f2; }
    .approval-btn--revision:hover:not(:disabled) { background:#f9fafb; }
    .approval-btn--revision { width:100%; }

    .inc-provide-btn { margin-top:10px; }

    /* ── Edit card ── */
    .inc-edit-card { display:flex; flex-direction:column; gap:8px; }
    .inc-edit-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:6px; }

    /* ── Tabs ── */
    .inc-tabs {
      display:flex; gap:4px; padding:0 6px;
      border-bottom:1px solid #E9EBEF;
      overflow-x:auto; scrollbar-width:none;
    }
    .inc-tabs::-webkit-scrollbar { display:none; }
    .inc-tab {
      display:inline-flex; align-items:center; gap:7px;
      padding:10px 12px 11px;
      background:transparent; border:none; cursor:pointer;
      font-family:inherit; font-size:12.25px; font-weight:500;
      color:#717182; white-space:nowrap;
      border-bottom:2px solid transparent;
      margin-bottom:-1px;
      transition:color 150ms ease-in-out, border-color 150ms ease-in-out;
    }
    .inc-tab:hover { color:#030213; }
    .inc-tab:focus-visible { outline:2px solid #D4183D; outline-offset:-2px; border-radius:4px; }
    .inc-tab--active { color:#D4183D; font-weight:600; border-bottom-color:#D4183D; }
    .inc-tab--active .inc-tab-icon :deep(svg) { stroke:#D4183D; }
    .inc-tab-icon {
      display:inline-flex; align-items:center; justify-content:center;
      width:15px; height:15px; flex-shrink:0;
    }
    .inc-tab-icon :deep(svg) {
      width:15px; height:15px; display:block;
      stroke:currentColor; fill:none;
    }
    .inc-tab-label { line-height:1; }

    /* ── Tab content area ── */
    .inc-tab-content { display:flex; flex-direction:column; gap:14px; }

    /* ── Overview grid (two columns) ── */
    .inc-overview-grid {
      display:grid; grid-template-columns:1fr 1fr; gap:12px 16px;
    }
    @media (max-width: 720px) { .inc-overview-grid { grid-template-columns:1fr; } }
    .inc-info-cell {
      background:#FFFFFF; border:1px solid #E9EBEF;
      border-radius:8.75px; padding:12px 14px;
    }
    .inc-info-label {
      font-size:10.5px; font-weight:500; color:#717182;
      margin-bottom:4px;
    }
    .inc-info-value {
      font-size:12.25px; font-weight:600; color:#030213; line-height:17.5px;
    }

    /* ── Description card ── */
    .inc-desc-card .inc-desc-title {
      font-size:12.25px; font-weight:600; color:#030213; margin-bottom:8px;
    }
    .inc-desc-text {
      margin:0; font-size:12.25px; color:#030213; line-height:20px; white-space:pre-wrap;
    }

    /* ── Immediate Impact (amber/warning) ── */
    .inc-impact-card {
      background:#FFFBEB;
      border:1px solid #FDE68A;
      border-radius:8.75px;
      padding:16px;
    }
    .inc-impact-card .inc-impact-title {
      font-size:12.25px; font-weight:600; color:#92400E; margin-bottom:8px;
    }
    .inc-impact-text { margin:0; font-size:12.25px; color:#92400E; line-height:20px; }

    /* ── Reuse (existing tab internals) ── */
    .tab-card { display:flex; flex-direction:column; gap:14px; }
    .tab-row { display:flex; gap:12px; font-size:12.25px; }
    .tab-k { font-size:10.5px; font-weight:700; color:#717182; text-transform:uppercase; min-width:96px; }
    .tab-block p { margin:6px 0 0; font-size:12.25px; color:#030213; line-height:20px; white-space:pre-wrap; }
    .tab-checklist { display:flex; flex-direction:column; gap:6px; }
    .tab-check-item { display:flex; align-items:center; gap:8px; font-size:12.25px; }
    .chk { font-size:11px; color:#717182; }
    .chk.done { color:#16A34A; }
    .why-line { font-size:12.25px; margin-top:6px; }
    .att-list { display:flex; flex-direction:column; gap:8px; }
    .att-row {
      padding:12px; border:1px solid #ECECF0; border-radius:8px;
      background:#F9FAFB;
    }
    .att-name { font-size:12.25px; font-weight:600; color:#030213; }
    .att-meta { font-size:10.5px; color:#717182; margin-top:2px; }
    .capa-summary { display:flex; gap:18px; flex-wrap:wrap; padding:8px 0; }
    .capa-stat { text-align:center; min-width:60px; }
    .capa-stat-val { display:block; font-size:21px; font-weight:700; color:#030213; line-height:28px; }
    .capa-stat-lbl {
      font-size:10.5px; color:#717182; text-transform:uppercase; letter-spacing:0.06em;
    }
    .comment-list, .history-list { display:flex; flex-direction:column; gap:10px; }
    .comment-row, .history-row {
      padding:12px; border:1px solid #ECECF0; border-radius:8px; background:#FAFAFA;
    }
    .comment-hd { display:flex; justify-content:space-between; margin-bottom:4px; }
    .comment-type {
      font-size:10.5px; font-weight:700; color:#2563EB; background:#EFF6FF;
      padding:2px 6px; border-radius:4px;
    }
    .comment-time { font-size:10.5px; color:#717182; }
    .comment-text {
      font-size:12.25px; color:#030213; margin:6px 0; line-height:18px; white-space:pre-wrap;
    }
    .comment-meta { font-size:10.5px; color:#717182; margin-top:4px; }
    .history-states { font-size:12.25px; font-weight:600; color:#030213; }
    .history-arrow { color:#717182; margin:0 6px; }
    .history-to { color:#16A34A; }
    .inc-link-btn {
      align-self:flex-start;
      margin-top:6px;
      padding:6px 12px; font-size:10.5px; font-weight:600;
      color:#D4183D; background:#FFFFFF;
      border:1px solid #FECACA; border-radius:4px; cursor:pointer;
    }
    .inc-link-btn:hover { background:#FEF2F2; }
    .inc-link-btn:focus-visible { outline:2px solid #D4183D; outline-offset:2px; }

    /* ── Generic small inline labels used inside tab blocks ── */
    .tab-empty {
      padding:2rem; text-align:center; color:#717182; font-size:12.25px;
    }
  `],
})
export class IncidentDetailComponent implements OnInit {
  readonly auth = inject(AuthService);

  activeTab = 'Overview';
  readonly tabItems = TAB_ITEMS;

  incident = signal<IncidentDetail | null>(null);
  actionsSummary = signal<ActionsSummary | null>(null);
  attachments = signal<IncidentAttachment[]>([]);
  investigation = signal<InvestigationWorkspace | null>(null);
  rca = signal<RcaDto | null>(null);
  timeline = signal<TimelineEntry[]>([]);

  loading = signal(true);
  attachmentsLoading = signal(false);
  investigationLoading = signal(false);
  rcaLoading = signal(false);
  timelineLoading = signal(false);
  timelineError = signal<string | null>(null);

  investigationError = signal<string | null>(null);
  rcaError = signal<string | null>(null);

  attachmentsLoaded = false;
  investigationLoaded = false;
  rcaLoaded = false;
  timelineLoaded = false;

  error = signal<string | null>(null);
  actionPending = signal(false);
  actionMessage = signal<{ ok: boolean; text: string } | null>(null);

  showEditPanel = signal(false);
  editCategory = '';
  editSeverity = 4;
  editReason = '';
  provideInfoText = '';
  unmaskedEmail = signal<string | null>(null);
  unmaskBusy = signal(false);

  fromApprover = false;

  commentEntries = computed(() =>
    this.timeline().filter(e =>
      e.eventType !== 'STATE_CHANGE' && (e.description || e.eventType === 'DECISION' || e.eventType === 'APPROVAL')
    )
  );

  historyEntries = computed(() =>
    this.timeline().filter(e => e.eventType === 'STATE_CHANGE' || e.fromStatus || e.toStatus)
  );

  severityKey = computed(() => this.severityLabel().toLowerCase());

  /** Tab strip icons — full SVG markup (bound on a span, not nested inside svg). */
  tabIconSvg(tabId: string): string {
    const s = 'stroke="currentColor" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
    const icons: Record<string, string> = {
      'Overview': `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" ${s}/><polyline points="14 2 14 8 20 8" ${s}/><line x1="16" y1="13" x2="8" y2="13" ${s}/><line x1="16" y1="17" x2="8" y2="17" ${s}/>`,
      'Timeline': `<circle cx="12" cy="12" r="10" ${s}/><polyline points="12 6 12 12 16 14" ${s}/>`,
      'Investigation': `<circle cx="11" cy="11" r="8" ${s}/><path d="m21 21-4.35-4.35" ${s}/>`,
      'Root Cause': `<circle cx="6" cy="6" r="3" ${s}/><circle cx="6" cy="18" r="3" ${s}/><circle cx="18" cy="18" r="3" ${s}/><path d="M6 9v6M9 18h6M9 6h6a4 4 0 0 1 4 4v8" ${s}/>`,
      'Corrective Actions': `<path d="M9 11 12 14 22 4" ${s}/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" ${s}/>`,
      'Attachments': `<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" ${s}/>`,
      'Comments': `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" ${s}/>`,
      'History': `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" ${s}/><path d="M3 3v5h5" ${s}/><path d="M12 7v5l4 2" ${s}/>`,
      'Audit Log': `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" ${s}/><path d="m9 12 2 2 4-4" ${s}/>`,
    };
    const inner = icons[tabId] ?? icons['Overview'];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  }

  resolvers = signal<Resolver[]>([]);
  resolversLoading = signal(false);
  showApprovePicker = signal(false);
  selectedResolverId = '';

  /** Opens the resolver picker, loading the assignable-resolver list from the backend. */
  openApprovePicker(): void {
    if (this.actionPending()) return;
    this.showApprovePicker.set(true);
    this.selectedResolverId = '';
    this.resolversLoading.set(true);
    this.incidentService.getResolvers().subscribe({
      next: list => { this.resolvers.set(list); this.resolversLoading.set(false); },
      error: () => { this.resolvers.set([]); this.resolversLoading.set(false); },
    });
  }

  /** Approves the incident and assigns it to the resolver selected in the picker. */
  approveIncident(): void {
    const inc = this.incident();
    if (!inc || !this.selectedResolverId || this.actionPending()) return;
    this.actionPending.set(true);
    this.incidentService.approveIncident(inc.id, this.selectedResolverId).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.showApprovePicker.set(false);
        this.actionMessage.set({ ok: true, text: 'Incident approved.' });
        this.reload();
      },
      error: err => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: false, text: err?.error?.error ?? 'Approval failed.' });
      },
    });
  }

  /** Reject: collects a free-text reason and marks this incident as soft-rejected. */
  rejectIncident(): void {
    const inc = this.incident();
    if (!inc || this.actionPending()) return;
    const reason = prompt('Reason for rejection (min 10 chars):');
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) this.actionMessage.set({ ok: false, text: 'Reason must be at least 10 characters.' });
      return;
    }
    this.actionPending.set(true);
    this.incidentService.rejectIncident(inc.id, 'Soft', reason.trim()).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: true, text: 'Incident rejected.' });
        this.reload();
      },
      error: err => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: false, text: err?.error?.error ?? 'Rejection failed.' });
      },
    });
  }

  /** Request revision / more info from the resolver. */
  requestRevision(): void {
    const inc = this.incident();
    if (!inc || this.actionPending()) return;
    const question = prompt('What does the resolver need to address? (min 10 chars)');
    if (!question || question.trim().length < 10) {
      if (question !== null) this.actionMessage.set({ ok: false, text: 'Please provide at least 10 characters of context.' });
      return;
    }
    this.actionPending.set(true);
    this.incidentService.requestInfo(inc.id, question.trim()).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: true, text: 'Revision requested.' });
        this.reload();
      },
      error: err => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: false, text: err?.error?.error ?? 'Could not request revision.' });
      },
    });
  }
  statusKey = computed(() =>
    (this.incident()?.displayStatus ?? '').toLowerCase().replace(/\s+/g, '-')
  );

  showApproverPanel = computed(() =>
    this.auth.currentRole() === 'APPROVER' &&
    APPROVER_ACTION_STATUSES.has(this.incident()?.displayStatus ?? '')
  );

  canEdit = computed(() => this.auth.currentRole() === 'APPROVER');

  canClose = computed(() => {
    const role = this.auth.currentRole();
    const status = this.incident()?.displayStatus ?? '';
    return role === 'RESOLVER' && !['Closed', 'Resolved', 'Merged Closed', 'Rejected'].includes(status);
  });

  canUnmask = computed(() =>
    this.incident()?.isConfidential === true &&
    GOVERNANCE_ROLES.has(this.auth.currentRole()?.toUpperCase() ?? '')
  );

  canProvideInfo = computed(() =>
    this.auth.currentRole() === 'REPORTER' &&
    this.incident()?.displayStatus === 'Pending Reporter Input'
  );

  completedChecklist = computed(() =>
    this.investigation()?.checklistItems.filter(i => i.isCompleted).length ?? 0
  );

  resolutionSteps = computed(() => {
    const status = (this.incident()?.displayStatus ?? '').toLowerCase();
    const past = (keys: string[]) => keys.some(k => status.includes(k));
    const capaDone = (this.actionsSummary()?.completed ?? 0) > 0;
    return [
      { label: 'Report', done: true },
      { label: 'Investigation', done: past(['progress', 'review', 'resolved', 'closed']) },
      { label: 'Root Cause', done: past(['resolved', 'closed']) || !!this.rca()?.submittedAt },
      { label: 'CAPA', done: capaDone || past(['resolved', 'closed']) },
      { label: 'Approval', done: past(['resolved', 'closed']) },
      { label: 'Closure', done: past(['closed']) },
    ];
  });

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private incidentService: IncidentService,
    private investigationService: InvestigationService,
    private rcaService: RcaService,
    private governance: GovernanceService,
    private recentIncident: RecentIncidentService,
  ) {}

  ngOnInit(): void {
    this.fromApprover = this.route.snapshot.queryParamMap.get('from') === 'approver';
    this.route.paramMap.subscribe(params => {
      const idOrRef = params.get('id');
      if (!idOrRef) return;
      this.recentIncident.setLastViewed(idOrRef);
      this.load(idOrRef);
    });
  }

  goBack(): void {
    this.router.navigate([this.fromApprover || this.auth.currentRole() === 'APPROVER' ? '/approver/queue' : '/my-incidents']);
  }

  reload(): void {
    const inc = this.incident();
    if (inc) this.load(inc.id);
  }

  private load(idOrRef: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.investigationLoaded = false;
    this.rcaLoaded = false;
    this.timelineLoaded = false;
    this.attachmentsLoaded = false;

    this.incidentService.getIncident(idOrRef).subscribe({
      next: inc => {
        this.incident.set(inc);
        this.editCategory = inc.category;
        this.editSeverity = inc.severity;
        this.loading.set(false);
        this.recentIncident.setLastViewed(inc.incidentReference);
        this.loadActionsSummary(inc.id);
        if (this.activeTab !== 'Overview') this.selectTab(this.activeTab);
      },
      error: () => {
        this.error.set('Incident not found or you do not have access.');
        this.loading.set(false);
      },
    });
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    const inc = this.incident();
    if (!inc) return;

    if (tab === 'Attachments' && !this.attachmentsLoaded) this.loadAttachments(inc.id);
    if (tab === 'Investigation' && !this.investigationLoaded) this.loadInvestigation(inc.id);
    if (tab === 'Root Cause' && !this.rcaLoaded) this.loadRca(inc.id);
    if ((tab === 'Comments' || tab === 'History') && !this.timelineLoaded) this.loadTimeline(inc.id);
  }

  private loadActionsSummary(incidentId: string): void {
    this.incidentService.getActionsSummary(incidentId).subscribe({
      next: s => this.actionsSummary.set(s.totalActions > 0 ? s : null),
      error: () => this.actionsSummary.set(null),
    });
  }

  private loadAttachments(incidentId: string): void {
    this.attachmentsLoaded = true;
    this.attachmentsLoading.set(true);
    this.incidentService.getAttachments(incidentId).subscribe({
      next: rows => { this.attachments.set(rows); this.attachmentsLoading.set(false); },
      error: () => { this.attachments.set([]); this.attachmentsLoading.set(false); },
    });
  }

  private loadInvestigation(incidentId: string): void {
    this.investigationLoaded = true;
    this.investigationLoading.set(true);
    this.investigationError.set(null);
    this.investigationService.getInvestigation(incidentId).subscribe({
      next: data => { this.investigation.set(data); this.investigationLoading.set(false); },
      error: err => {
        this.investigation.set(null);
        this.investigationLoading.set(false);
        const msg = err.status === 403
          ? 'Investigation details require resolver access.'
          : err.status === 404
            ? 'No investigation opened yet.'
            : 'Failed to load investigation.';
        this.investigationError.set(msg);
      },
    });
  }

  private loadRca(incidentId: string): void {
    this.rcaLoaded = true;
    this.rcaLoading.set(true);
    this.rcaError.set(null);
    this.rcaService.getRca(incidentId).subscribe({
      next: data => { this.rca.set(data); this.rcaLoading.set(false); },
      error: err => {
        this.rca.set(null);
        this.rcaLoading.set(false);
        this.rcaError.set(err.status === 403
          ? 'Root cause details require resolver access.'
          : err.status === 404
            ? 'No root cause analysis recorded.'
            : 'Failed to load RCA.');
      },
    });
  }

  private loadTimeline(incidentId: string): void {
    this.timelineLoaded = true;
    this.timelineLoading.set(true);
    this.timelineError.set(null);
    this.governance.getTimeline(incidentId).subscribe({
      next: rows => { this.timeline.set(rows); this.timelineLoading.set(false); },
      error: err => {
        this.timeline.set([]);
        this.timelineLoading.set(false);
        this.timelineError.set(err.status === 403
          ? 'Timeline requires governance or approver access. Use the Timeline tab if available.'
          : 'Failed to load timeline events.');
      },
    });
  }

  saveEdit(): void {
    const inc = this.incident();
    if (!inc || this.editReason.length < 10) return;
    this.actionPending.set(true);
    this.incidentService.reassignIncident(inc.id, this.editCategory, this.editSeverity, this.editReason).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.showEditPanel.set(false);
        this.actionMessage.set({ ok: true, text: 'Classification updated.' });
        this.reload();
      },
      error: () => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: false, text: 'Update failed.' });
      },
    });
  }

  closeIncident(): void {
    const inc = this.incident();
    if (!inc || !confirm('Resolve / close this incident? CAPA and root cause must be complete.')) return;
    this.actionPending.set(true);
    this.investigationService.resolveIncident(inc.id).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: true, text: 'Incident resolved.' });
        this.reload();
      },
      error: err => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: false, text: err.error?.error ?? 'Close failed — ensure CAPA and root cause are complete.' });
      },
    });
  }

  unmaskReporter(): void {
    const inc = this.incident();
    if (!inc) return;
    const reason = prompt('Reason for unmasking reporter identity (required):');
    if (!reason?.trim()) return;
    this.unmaskBusy.set(true);
    this.governance.unmaskReporter(inc.id, reason.trim()).subscribe({
      next: res => {
        this.unmaskedEmail.set(res.reporterEmail);
        this.unmaskBusy.set(false);
      },
      error: err => {
        this.unmaskBusy.set(false);
        this.actionMessage.set({ ok: false, text: err.error?.error ?? 'Unmask failed.' });
      },
    });
  }

  submitProvideInfo(): void {
    const inc = this.incident();
    if (!inc || !this.provideInfoText.trim()) return;
    this.actionPending.set(true);
    this.incidentService.provideInfo(inc.id, this.provideInfoText.trim()).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.provideInfoText = '';
        this.actionMessage.set({ ok: true, text: 'Response submitted.' });
        this.reload();
      },
      error: () => {
        this.actionPending.set(false);
        this.actionMessage.set({ ok: false, text: 'Failed to submit response.' });
      },
    });
  }

  openInvestigationWorkspace(): void {
    const ref = this.incident()?.incidentReference;
    if (ref) this.router.navigate(['/resolver/incidents', ref, 'investigation']);
  }

  openRcaWorkspace(): void {
    const ref = this.incident()?.incidentReference;
    if (ref) this.router.navigate(['/resolver/incidents', ref, 'rca']);
  }

  openCapaWorkspace(): void {
    const ref = this.incident()?.incidentReference;
    if (ref) this.router.navigate(['/resolver/incidents', ref, 'capa']);
  }

  attachmentName(a: IncidentAttachment): string {
    const seg = (a.storageKey ?? '').split(/[\\/]/).pop();
    return seg && seg.length > 0 ? seg : 'Attachment';
  }

  severityLabel(): string {
    const v = this.incident()?.severity ?? 4;
    return ['', 'Critical', 'High', 'Medium', 'Low'][v] ?? 'Low';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  slaDueLabel(): string {
    const inc = this.incident();
    if (!inc?.slaStartedAt || !inc.slaTargetMinutes) return '—';
    const due = new Date(inc.slaStartedAt);
    due.setMinutes(due.getMinutes() + inc.slaTargetMinutes);
    return due.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
