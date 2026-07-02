import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QrAdminComponent } from './qr-admin.component';
import { AdminService, AdminFactory, AdminLine, AdminNotificationTemplate, AdminUser } from './admin.service';
import { EscalationService, EscalationRuleDto } from '../escalation/escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminSection =
  | 'categories' | 'severity' | 'priorities' | 'departments'
  | 'factory' | 'escalation-rules' | 'notif-templates' | 'user-roles' | 'users' | 'workflow'
  | 'qr-codes';

interface Category {
  id: string; name: string; active: boolean; subcategories: string[];
}
interface SeverityLevel {
  id: string; code: string; label: string; color: string; slaHours: number; autoEscalate: boolean;
}
interface SeverityDisplay extends SeverityLevel {
  description: string;
  responseText: string;
  displayColor: string;
  sortOrder: number;
}

const SEVERITY_UI: Record<string, { description: string; responseText: string; color: string; sortOrder: number }> = {
  Low: {
    description: 'Minor incidents with no injury or minor property damage. First aid treatment, if any.',
    responseText: '48 hours',
    color: '#22c55e',
    sortOrder: 1,
  },
  Medium: {
    description: 'Moderate incidents requiring medical treatment. Limited production impact.',
    responseText: '24 hours',
    color: '#f97316',
    sortOrder: 2,
  },
  High: {
    description: 'Serious incidents with injury requiring medical attention. Significant production impact.',
    responseText: '4 hours',
    color: '#ea580c',
    sortOrder: 3,
  },
  Critical: {
    description: 'Life-threatening or major incidents. Immediate escalation to factory management and compliance.',
    responseText: '15 minutes',
    color: '#ef4444',
    sortOrder: 4,
  },
};
interface Department {
  id: string; name: string; manager: string; location: string; active: boolean;
}
interface Priority {
  id: string; code: string; label: string; color: string;
}
interface RoleCard {
  id: string;
  code: string;
  label: string;
  badgeColor: string;   // text colour
  badgeBg: string;      // badge background
  userCount: number;
  permissions: string[];
}

const ROLE_BADGE_COLORS: Record<string, { color: string; bg: string }> = {
  REPORTER:            { color: '#374151', bg: '#f3f4f6' },
  APPROVER:            { color: '#1d4ed8', bg: '#eff6ff' },
  RESOLVER:            { color: '#15803d', bg: '#f0fdf4' },
  ADMIN:               { color: '#7c3aed', bg: '#f5f3ff' },
};

const LEFT_NAV: { id: AdminSection; label: string }[] = [
  { id:'categories',       label:'Categories'           },
  { id:'severity',         label:'Severity Levels'      },
  { id:'priorities',       label:'Priorities'           },
  { id:'departments',      label:'Departments'          },
  { id:'factory',          label:'Factory Structure'    },
  { id:'escalation-rules', label:'Escalation Rules'     },
  { id:'notif-templates',  label:'Notification Templates'},
  { id:'user-roles',       label:'User Roles'           },
  { id:'users',            label:'User Assignment'      },
  { id:'workflow',         label:'Workflow Config'      },
  { id:'qr-codes',         label:'QR Codes'             },
];

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, FormsModule, QrAdminComponent],
  template: `
<div class="adm-page">

  <!-- ── Page Header ── -->
  <div class="adm-hd">
    <h1 class="adm-title">Administration</h1>
    <p class="adm-sub">Configure categories, roles, workflows, and system settings</p>
  </div>

  <!-- ── Two-panel layout ── -->
  <div class="adm-layout">

    <!-- Left nav -->
    <nav class="adm-nav">
      @for (item of leftNav; track item.id) {
        <button [class]="'adm-nav-item' + (activeSection() === item.id ? ' adm-nav-item--active' : '')"
          (click)="selectSection(item.id)">
          {{ item.label }}
        </button>
      }
    </nav>

    <!-- Right content -->
    <div class="adm-content">

      <!-- ── CATEGORIES ── -->
      @if (activeSection() === 'categories') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">Categories</h2>
            <p class="content-sub">{{ categories().length }} categories configured</p>
          </div>
          <button class="btn-add-primary" (click)="showCatForm.set(true)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Category
          </button>
        </div>

        @if (showCatForm()) {
          <div class="inline-form">
            <input type="text" [(ngModel)]="newCatName" placeholder="Category name…" class="form-input">
            <button class="btn-save-sm" [disabled]="!newCatName.trim()" (click)="addCategory()">Add</button>
            <button class="btn-cancel-sm" (click)="showCatForm.set(false); newCatName=''">Cancel</button>
          </div>
        }

        <div class="cat-list">
          @for (cat of categories(); track cat.id) {
            <div class="cat-row">
              <div class="cat-row-hd">
                <div class="cat-left">
                  <span class="cat-dot" [style.background]="cat.active ? '#22c55e' : '#d1d5db'"></span>
                  <span class="cat-name">{{ cat.name }}</span>
                  <span [class]="'cat-status ' + (cat.active ? 'status-active' : 'status-inactive')">
                    {{ cat.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="cat-actions">
                  <button class="icon-btn" title="Edit" (click)="editCategory(cat)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                    </svg>
                  </button>
                  <button class="icon-btn icon-btn--danger" title="Delete" (click)="deleteCategory(cat)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="subcat-row">
                @for (sub of cat.subcategories; track sub) {
                  <span class="subcat-chip">{{ sub }}</span>
                }
                <button class="subcat-add" (click)="addSubcategory(cat)">+ Sub-category</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── SEVERITY LEVELS ── -->
      @if (activeSection() === 'severity') {
        <h2 class="content-title sev-page-title">Severity Levels</h2>
        <div class="sev-list">
          @for (s of sortedSeverityLevels(); track s.id) {
            <div class="sev-card">
              <div class="sev-card-top">
                <div class="sev-card-left">
                  <span class="sev-dot" [style.background]="s.displayColor"></span>
                  <span class="sev-name">{{ s.label }}</span>
                  <span class="sev-response-badge">Response: {{ s.responseText }}</span>
                </div>
                <button type="button" class="btn-edit-sev" (click)="editSeverity(s)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                  </svg>
                  Edit
                </button>
              </div>
              <p class="sev-desc">{{ s.description }}</p>
            </div>
          }
        </div>
      }

      <!-- ── PRIORITIES ── -->
      @if (activeSection() === 'priorities') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">Priorities</h2>
            <p class="content-sub">{{ priorities().length }} priority levels configured</p>
          </div>
        </div>
        <div class="prio-list">
          @for (p of priorities(); track p.id) {
            <div class="prio-row">
              <span class="prio-dot" [style.background]="p.color"></span>
              <span class="prio-label">{{ p.label }}</span>
              <span class="prio-meta">Code: {{ p.code }}</span>
              <button class="icon-btn" title="Edit" (click)="editPriority(p)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                </svg>
              </button>
            </div>
          }
        </div>
      }

      <!-- ── DEPARTMENTS ── -->
      @if (activeSection() === 'departments') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">Departments</h2>
            <p class="content-sub">{{ departments().length }} departments configured</p>
          </div>
          <button class="btn-add-primary" (click)="showDeptForm.set(true)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Department
          </button>
        </div>

        @if (showDeptForm()) {
          <div class="inline-form">
            <input type="text" [(ngModel)]="newDept.name" placeholder="Department name…" class="form-input">
            <input type="text" [(ngModel)]="newDept.manager" placeholder="Manager…" class="form-input">
            <input type="text" [(ngModel)]="newDept.location" placeholder="Location…" class="form-input">
            <button class="btn-save-sm" [disabled]="!newDept.name.trim()" (click)="addDepartment()">Add</button>
            <button class="btn-cancel-sm" (click)="showDeptForm.set(false)">Cancel</button>
          </div>
        }

        <div class="dept-list">
          @for (d of departments(); track d.id) {
            <div class="dept-row">
              <div class="dept-dot" [style.background]="d.active ? '#22c55e' : '#d1d5db'"></div>
              <div class="dept-info">
                <div class="dept-name">{{ d.name }}</div>
                <div class="dept-meta">{{ d.manager }} · {{ d.location }}</div>
              </div>
              <span [class]="'dept-badge ' + (d.active ? 'badge-active' : 'badge-inactive')">
                {{ d.active ? 'Active' : 'Inactive' }}
              </span>
              <div class="dept-btns">
                <button class="icon-btn" title="Edit" (click)="editDepartment(d)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                  </svg>
                </button>
                <button class="icon-btn icon-btn--danger" title="Delete" (click)="deleteDepartment(d)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── USER ROLES ── -->
      @if (activeSection() === 'user-roles') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">User Roles</h2>
            <p class="content-sub">{{ roles().length }} roles configured across {{ totalUserCount() | number }} users</p>
          </div>
          <button class="btn-add-primary" (click)="addRole()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Role
          </button>
        </div>

        <div class="role-list">
          @for (role of roles(); track role.id) {
            <div class="role-card">

              <!-- Card header -->
              <div class="role-card-hd">
                <div class="role-hd-left">
                  <span class="role-badge"
                    [style.color]="role.badgeColor"
                    [style.background]="role.badgeBg">
                    {{ role.label }}
                  </span>
                  <span class="role-user-count">{{ role.userCount | number }} users</span>
                </div>
                <button class="btn-configure" (click)="configureRole(role)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                  </svg>
                  Configure
                </button>
              </div>

              <!-- Permissions grid — 2 columns -->
              <div class="role-perms">
                @for (perm of role.permissions; track perm) {
                  <div class="role-perm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="#22c55e" stroke-width="2.5"
                      stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                    <span>{{ perm }}</span>
                  </div>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- ── USER ASSIGNMENT ── -->
      @if (activeSection() === 'users') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">User Assignment</h2>
            <p class="content-sub">{{ filteredUsers().length }} of {{ users().length }} users</p>
          </div>
        </div>
        <div class="inline-form" style="margin-bottom:1rem">
          <input type="text" class="form-input" placeholder="Search by name or email…"
            [ngModel]="userSearch()" (ngModelChange)="userSearch.set($event)">
        </div>
        @if (usersLoading()) {
          <div class="stub-empty">Loading users…</div>
        } @else if (users().length === 0) {
          <div class="stub-empty">No users found.</div>
        } @else {
          <div class="user-table-wrap">
            <table class="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Current Role</th>
                  <th>Assign Role</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filteredUsers(); track u.id) {
                  <tr>
                    <td>{{ u.name }}</td>
                    <td class="user-email">{{ u.email }}</td>
                    <td>
                      <span [class]="'cat-status ' + (u.isActive ? 'status-active' : 'status-inactive')">
                        {{ u.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <span class="role-badge" style="color:#374151;background:#f3f4f6;font-size:0.72rem">
                        {{ u.roleLabel || u.role }}
                      </span>
                    </td>
                    <td>
                      <select class="user-role-select"
                        [disabled]="assigningUserId() === u.id"
                        [ngModel]="u.roleId"
                        (ngModelChange)="assignUserRole(u, $event)">
                        @for (r of roles(); track r.id) {
                          <option [value]="r.id">{{ r.label }}</option>
                        }
                      </select>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- ── QR CODES ── -->
      @if (activeSection() === 'qr-codes') {
        <app-qr-admin></app-qr-admin>
      }

      <!-- ── FACTORY STRUCTURE ── -->
      @if (activeSection() === 'factory') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">Factory Structure</h2>
            <p class="content-sub">{{ factories().length }} {{ factories().length === 1 ? 'factory' : 'factories' }} · production lines</p>
          </div>
        </div>
        <div class="cat-list">
          @for (f of factories(); track f.id) {
            <div class="cat-row">
              <div class="cat-row-hd">
                <div class="cat-left">
                  <span class="cat-dot" [style.background]="f.active ? '#22c55e' : '#d1d5db'"></span>
                  <span class="cat-name">{{ f.name }}</span>
                  <span class="fac-loc">{{ f.location }}</span>
                  <span [class]="'cat-status ' + (f.active ? 'status-active' : 'status-inactive')">
                    {{ f.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="cat-actions">
                  <button class="subcat-add" (click)="toggleFactory(f)">
                    {{ selectedFactoryId() === f.id ? 'Hide lines' : 'View lines' }}
                  </button>
                  <button class="icon-btn" title="Edit" (click)="editFactory(f)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                    </svg>
                  </button>
                </div>
              </div>
              @if (selectedFactoryId() === f.id) {
                <div class="subcat-row">
                  @for (l of factoryLines(); track l.id) {
                    <span class="subcat-chip">{{ l.name }}</span>
                  }
                  @if (factoryLines().length === 0) {
                    <span class="fac-loc">No production lines yet.</span>
                  }
                  <button class="subcat-add" (click)="addLine(f)">+ Production Line</button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ── ESCALATION RULES ── -->
      @if (activeSection() === 'escalation-rules') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">Escalation Rules</h2>
            <p class="content-sub">{{ escRules().length }} rules configured</p>
          </div>
          <button class="btn-add-primary" (click)="showRuleForm.set(true)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Rule
          </button>
        </div>

        @if (showRuleForm()) {
          <div class="inline-form" style="flex-wrap:wrap">
            <input type="text" [(ngModel)]="newRule.name" placeholder="Rule name…" class="form-input" style="flex:1 1 180px">
            <input type="number" [(ngModel)]="newRule.triggerAfterMinutes" placeholder="Trigger after (min)" class="form-input" style="flex:0 1 150px">
            <input type="text" [(ngModel)]="newRule.channelsRaw" placeholder="Channels (Email, SMS)" class="form-input" style="flex:1 1 160px">
            <input type="text" [(ngModel)]="newRule.recipientsRaw" placeholder="Recipients (Supervisor…)" class="form-input" style="flex:1 1 160px">
            <button class="btn-save-sm" [disabled]="!newRule.name.trim()" (click)="addRule()">Add</button>
            <button class="btn-cancel-sm" (click)="showRuleForm.set(false)">Cancel</button>
          </div>
        }

        <div class="cat-list">
          @for (r of escRules(); track r.id) {
            <div class="cat-row">
              <div class="cat-row-hd">
                <div class="cat-left">
                  <span class="cat-name">{{ r.name }}</span>
                  <span [class]="'cat-status ' + (r.active ? 'status-active' : 'status-inactive')"
                    style="cursor:pointer" title="Toggle active" (click)="toggleRule(r)">
                    {{ r.active ? 'Active' : 'Disabled' }}
                  </span>
                </div>
                <div class="cat-actions">
                  <button class="icon-btn icon-btn--danger" title="Delete" (click)="deleteRule(r)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              @if (r.description) { <div class="tmpl-body">{{ r.description }}</div> }
              <div class="subcat-row">
                <span class="subcat-chip">after {{ r.triggerAfterMinutes }} min</span>
                @for (ch of r.channels; track ch) { <span class="chip-blue">{{ ch }}</span> }
                @for (rc of r.recipients; track rc) { <span class="chip-purple">{{ rc }}</span> }
              </div>
            </div>
          }
          @if (escRules().length === 0) {
            <div class="stub-empty">No escalation rules yet. Add one to get started.</div>
          }
        </div>
      }

      <!-- ── NOTIFICATION TEMPLATES ── -->
      @if (activeSection() === 'notif-templates') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">Notification Templates</h2>
            <p class="content-sub">{{ notifTemplates().length }} templates configured</p>
          </div>
          <button class="btn-add-primary" (click)="showNewTemplateForm.set(true)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Template
          </button>
        </div>

        <!-- New template inline form -->
        @if (showNewTemplateForm()) {
          <div class="inline-form-card">
            <div class="inline-form-title">New Notification Template</div>
            <div class="nt-form-grid">
              <div class="ff">
                <label>Trigger Event *</label>
                <input type="text" [(ngModel)]="newTemplate.triggerEvent" placeholder="e.g. INCIDENT_CREATED">
              </div>
              <div class="ff">
                <label>Channels (comma-separated)</label>
                <input type="text" [(ngModel)]="newTemplate.channelsRaw" placeholder="Email, Push, SMS">
              </div>
            </div>
            <div class="ff">
              <label>Subject Template</label>
              <input type="text" [(ngModel)]="newTemplate.subjectTemplate" placeholder="{{'{{'}}category{{'}}'}} incident at {{'{{'}}location{{'}}'}}">
            </div>
            <div class="ff">
              <label>Body Template</label>
              <textarea rows="2" [(ngModel)]="newTemplate.bodyTemplate" placeholder="Incident {{'{{'}}reference{{'}}'}} requires action."></textarea>
            </div>
            <div class="inline-form-actions">
              <button class="btn-cancel-sm" (click)="showNewTemplateForm.set(false)">Cancel</button>
              <button class="btn-save-sm" [disabled]="!newTemplate.triggerEvent.trim()" (click)="addTemplate()">Add Template</button>
            </div>
          </div>
        }

        <!-- Templates list -->
        <div class="notif-tmpl-list">
          @for (t of notifTemplates(); track t.id) {
            <div class="notif-tmpl-row">
              <!-- Left: name + badge + meta -->
              <div class="notif-tmpl-body">
                <div class="notif-tmpl-hd">
                  <span class="notif-tmpl-name">{{ formatTriggerLabel(t.triggerEvent) }}</span>
                  <span [class]="'notif-tmpl-badge ' + (t.active ? 'badge-active' : 'badge-inactive')">
                    {{ t.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="notif-tmpl-meta">
                  Trigger: {{ t.triggerEvent }}
                  @if (t.channels.length > 0) {
                    · Channels: {{ t.channels.join(', ') }}
                  }
                </div>
              </div>

              <!-- Right: Edit + Toggle -->
              <div class="notif-tmpl-actions">
                <button class="notif-edit-btn" (click)="editTemplate(t)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                  </svg>
                  Edit
                </button>
                <div class="toggle-wrap" (click)="toggleTemplate(t)">
                  <div [class]="'toggle ' + (t.active ? 'toggle--on' : '')">
                    <div class="toggle-knob"></div>
                  </div>
                </div>
              </div>
            </div>
          }

          @if (notifTemplates().length === 0) {
            <div class="stub-empty">No notification templates configured yet.</div>
          }
        </div>
      }

      <!-- ── WORKFLOW CONFIG (informational — no dedicated API yet) ── -->
      @if (activeSection() === 'workflow') {
        <div class="content-hd">
          <div>
            <h2 class="content-title">Workflow Config</h2>
            <p class="content-sub">How incident SLA & escalation behaviour is configured</p>
          </div>
        </div>
        <div class="wf-card">
          <p class="wf-lead">Incident workflow behaviour is driven by the settings below. Each links to the section that manages it.</p>
          <div class="wf-links">
            <button class="wf-link" (click)="selectSection('severity')">
              <span class="wf-link-title">Severity Levels</span>
              <span class="wf-link-sub">SLA hours &amp; auto-escalation per severity (L1–L4)</span>
            </button>
            <button class="wf-link" (click)="selectSection('escalation-rules')">
              <span class="wf-link-title">Escalation Rules</span>
              <span class="wf-link-sub">Trigger timing, channels &amp; recipients</span>
            </button>
            <button class="wf-link" (click)="selectSection('notif-templates')">
              <span class="wf-link-title">Notification Templates</span>
              <span class="wf-link-sub">Messages sent on each workflow event</span>
            </button>
          </div>
          <p class="wf-note">A dedicated workflow-state-machine config API is not yet exposed; the pipeline transitions are enforced server-side.</p>
        </div>
      }

    </div>
  </div>
</div>
`,
  styles: [`
    /* Page */
    .adm-page { padding:1.5rem 1.75rem 2rem; font-family:inherit; }

    /* Header */
    .adm-hd { margin-bottom:1.5rem; }
    .adm-title { font-size:1.5rem; font-weight:700; color:#111827; margin:0 0 4px; letter-spacing:-0.01em; }
    .adm-sub { font-size:0.82rem; color:#9ca3af; margin:0; }

    /* Two-panel layout */
    .adm-layout { display:grid; grid-template-columns:220px 1fr; gap:1.5rem; align-items:start; }

    /* Left nav */
    .adm-nav { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; padding:0.35rem 0; }
    .adm-nav-item { width:100%; text-align:left; padding:0.72rem 1.1rem; font-size:0.84rem; font-weight:500; color:#374151; background:none; border:none; cursor:pointer; transition:background .12s, color .12s; border-radius:0; }
    .adm-nav-item:hover { background:#fef2f2; color:#ef4444; }
    .adm-nav-item--active { background:#fef2f2; color:#ef4444; font-weight:600; }

    /* Content panel */
    .adm-content { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:1.5rem 1.65rem; min-height:520px; }
    .content-hd { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.25rem; }
    .content-title { font-size:1rem; font-weight:700; color:#111827; margin:0 0 3px; }
    .content-sub { font-size:0.78rem; color:#9ca3af; margin:0; }

    /* Add button */
    .btn-add-primary { display:flex; align-items:center; gap:6px; padding:7px 14px; font-size:0.8rem; font-weight:600; background:#ef4444; border:none; border-radius:7px; cursor:pointer; color:#fff; white-space:nowrap; flex-shrink:0; }
    .btn-add-primary:hover { background:#dc2626; }

    /* Inline add form */
    .inline-form { display:flex; gap:0.6rem; align-items:center; margin-bottom:1rem; }
    .form-input { flex:1; border:1px solid #e2e5e9; border-radius:7px; padding:8px 11px; font-size:0.85rem; color:#111827; }
    .form-input:focus { outline:none; border-color:#ef4444; }
    .btn-save-sm   { padding:7px 14px; font-size:0.8rem; font-weight:600; background:#ef4444; color:#fff; border:none; border-radius:7px; cursor:pointer; }
    .btn-save-sm:disabled { opacity:.45; cursor:not-allowed; }
    .btn-cancel-sm { padding:7px 12px; font-size:0.8rem; background:none; color:#6b7280; border:1px solid #e5e7eb; border-radius:7px; cursor:pointer; }

    /* Icon buttons */
    .icon-btn { background:none; border:none; color:#9ca3af; cursor:pointer; padding:4px; border-radius:5px; display:flex; align-items:center; justify-content:center; }
    .icon-btn:hover { color:#374151; background:#f3f4f6; }
    .icon-btn--danger:hover { color:#ef4444; background:#fef2f2; }

    /* ── Categories ── */
    .cat-list { display:flex; flex-direction:column; gap:0.75rem; }
    .cat-row { border:1px solid #f3f4f6; border-radius:9px; padding:0.9rem 1rem; }
    .cat-row-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.65rem; }
    .cat-left { display:flex; align-items:center; gap:0.6rem; }
    .cat-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .cat-name { font-size:0.88rem; font-weight:600; color:#111827; }
    .cat-status { font-size:0.67rem; font-weight:700; padding:2px 7px; border-radius:9px; }
    .status-active   { background:#f0fdf4; color:#16a34a; }
    .status-inactive { background:#f3f4f6; color:#9ca3af; }
    .cat-actions { display:flex; gap:0.3rem; }
    .subcat-row { display:flex; flex-wrap:wrap; gap:0.4rem; align-items:center; }
    .subcat-chip { font-size:0.73rem; background:#f3f4f6; color:#374151; padding:3px 9px; border-radius:6px; }
    .subcat-add { font-size:0.73rem; font-weight:600; color:#ef4444; background:none; border:1px solid #fecaca; border-radius:6px; padding:3px 9px; cursor:pointer; }
    .subcat-add:hover { background:#fef2f2; }

    /* ── Severity ── */
    .sev-page-title { margin:0 0 1.15rem; font-size:0.95rem; }
    .sev-list { display:flex; flex-direction:column; gap:0.85rem; }
    .sev-card { border:1px solid #e5e7eb; border-radius:10px; padding:1rem 1.15rem; background:#fff; }
    .sev-card-top { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:0.55rem; }
    .sev-card-left { display:flex; align-items:center; gap:0.55rem; flex-wrap:wrap; min-width:0; }
    .sev-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .sev-name { font-size:0.88rem; font-weight:700; color:#111827; }
    .sev-response-badge {
      font-size:0.72rem; font-weight:500; color:#6b7280;
      background:#f3f4f6; padding:3px 10px; border-radius:6px; white-space:nowrap;
    }
    .sev-desc { font-size:0.8rem; color:#6b7280; line-height:1.55; margin:0; }
    .btn-edit-sev {
      display:inline-flex; align-items:center; gap:5px; flex-shrink:0;
      padding:6px 12px; font-size:0.78rem; font-weight:500; color:#374151;
      background:#fff; border:1px solid #d1d5db; border-radius:7px; cursor:pointer;
      transition:background .12s, border-color .12s;
    }
    .btn-edit-sev:hover { background:#f9fafb; border-color:#9ca3af; }

    /* ── Notification Templates ── */
    .notif-tmpl-list { display:flex; flex-direction:column; gap:0; }
    .notif-tmpl-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1rem 0.25rem; border-bottom:1px solid #f3f4f6; }
    .notif-tmpl-row:last-child { border-bottom:none; }
    .notif-tmpl-body { flex:1; min-width:0; }
    .notif-tmpl-hd { display:flex; align-items:center; gap:0.55rem; margin-bottom:3px; }
    .notif-tmpl-name { font-size:0.88rem; font-weight:600; color:#111827; }
    .notif-tmpl-badge { font-size:0.67rem; font-weight:700; padding:2px 8px; border-radius:9px; }
    .notif-tmpl-meta { font-size:0.75rem; color:#9ca3af; }
    .notif-tmpl-actions { display:flex; align-items:center; gap:0.85rem; flex-shrink:0; }
    .notif-edit-btn { display:flex; align-items:center; gap:5px; padding:5px 12px; font-size:0.78rem; font-weight:500; background:#fff; border:1px solid #d1d5db; border-radius:7px; cursor:pointer; color:#374151; white-space:nowrap; }
    .notif-edit-btn:hover { background:#f9fafb; }

    /* Inline form card (shared for templates + rules) */
    .inline-form-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:1.1rem 1.3rem; margin-bottom:1rem; }
    .inline-form-title { font-size:0.88rem; font-weight:600; color:#111827; margin-bottom:0.85rem; }
    .nt-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
    .inline-form-actions { display:flex; gap:0.6rem; justify-content:flex-end; margin-top:0.5rem; }
    .ff { margin-bottom:0.75rem; }
    .ff label { display:block; font-size:0.73rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px; }
    .ff input, .ff select { width:100%; border:1px solid #e2e5e9; border-radius:7px; padding:8px 11px; font-size:0.84rem; color:#111827; box-sizing:border-box; background:#fff; }
    .ff textarea { width:100%; border:1px solid #e2e5e9; border-radius:7px; padding:8px 11px; font-size:0.84rem; color:#111827; box-sizing:border-box; resize:vertical; font-family:inherit; }
    .ff input:focus, .ff select:focus, .ff textarea:focus { outline:none; border-color:#ef4444; }

    /* ── Priorities ── */
    .prio-list { display:flex; flex-direction:column; gap:0.55rem; }
    .prio-row { display:flex; align-items:center; gap:0.85rem; padding:0.8rem 1rem; border:1px solid #f3f4f6; border-radius:9px; }
    .prio-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .prio-label { font-size:0.88rem; font-weight:600; color:#111827; flex:0 0 90px; }
    .prio-meta  { font-size:0.78rem; color:#9ca3af; flex:1; }

    /* ── Departments ── */
    .dept-list { display:flex; flex-direction:column; gap:0.55rem; }
    .dept-row { display:flex; align-items:center; gap:0.9rem; padding:0.85rem 1rem; border:1px solid #f3f4f6; border-radius:9px; }
    .dept-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .dept-info { flex:1; min-width:0; }
    .dept-name { font-size:0.88rem; font-weight:600; color:#111827; }
    .dept-meta { font-size:0.74rem; color:#9ca3af; margin-top:2px; }
    .dept-badge { font-size:0.67rem; font-weight:700; padding:2px 7px; border-radius:9px; white-space:nowrap; }
    .badge-active   { background:#f0fdf4; color:#16a34a; }
    .badge-inactive { background:#f3f4f6; color:#9ca3af; }
    .dept-btns { display:flex; gap:0.3rem; }

    /* ── Role cards ── */
    .role-list { display:flex; flex-direction:column; gap:0.85rem; }
    .role-card { border:1px solid #e5e7eb; border-radius:10px; padding:1rem 1.25rem; }
    .role-card-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.85rem; }
    .role-hd-left { display:flex; align-items:center; gap:0.65rem; }
    .role-badge { font-size:0.8rem; font-weight:700; padding:3px 12px; border-radius:20px; }
    .role-user-count { font-size:0.78rem; color:#9ca3af; }
    .btn-configure { display:flex; align-items:center; gap:5px; padding:6px 13px; font-size:0.78rem; font-weight:500; background:#fff; border:1px solid #d1d5db; border-radius:7px; cursor:pointer; color:#374151; }
    .btn-configure:hover { background:#f9fafb; }
    .role-perms { display:grid; grid-template-columns:1fr 1fr; gap:0.45rem 1rem; }
    .role-perm { display:flex; align-items:center; gap:0.45rem; font-size:0.81rem; color:#374151; }

    /* Stub */
    .stub-empty { padding:3rem 0; text-align:center; font-size:0.83rem; color:#9ca3af; }

    /* Users */
    .user-table-wrap { overflow-x:auto; }
    .user-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
    .user-table th { text-align:left; padding:0.55rem 0.65rem; color:#6b7280; font-weight:600;
      border-bottom:1px solid #e5e7eb; font-size:0.72rem; text-transform:uppercase; }
    .user-table td { padding:0.65rem; border-bottom:1px solid #f3f4f6; color:#374151; vertical-align:middle; }
    .user-email { color:#6b7280; font-size:0.78rem; }
    .user-role-select { min-width:160px; padding:6px 8px; font-size:0.78rem; border:1px solid #e2e5e9;
      border-radius:7px; background:#fff; color:#374151; }
    .user-role-select:disabled { opacity:0.6; cursor:not-allowed; }

    /* Factory / Templates / Rules shared */
    .fac-loc { font-size:0.75rem; color:#9ca3af; }
    .tmpl-subject { font-size:0.82rem; font-weight:600; color:#111827; margin:0.15rem 0 0.25rem; }
    .tmpl-body { font-size:0.78rem; color:#6b7280; line-height:1.55; margin-bottom:0.6rem; }
    .chip-blue { font-size:0.71rem; font-weight:600; background:#eff6ff; color:#2563eb; padding:3px 9px; border-radius:6px; }
    .chip-purple { font-size:0.71rem; font-weight:600; background:#f5f3ff; color:#6d28d9; padding:3px 9px; border-radius:6px; }

    /* Workflow config */
    .wf-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:1.25rem 1.4rem; }
    .wf-lead { font-size:0.85rem; color:#374151; margin:0 0 1rem; }
    .wf-links { display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1rem; }
    .wf-link { text-align:left; background:#f9fafb; border:1px solid #f1f3f5; border-radius:9px; padding:0.75rem 1rem; cursor:pointer; display:flex; flex-direction:column; gap:2px; transition:background .12s; }
    .wf-link:hover { background:#fef2f2; border-color:#fecaca; }
    .wf-link-title { font-size:0.85rem; font-weight:700; color:#111827; }
    .wf-link-sub { font-size:0.76rem; color:#9ca3af; }
    .wf-note { font-size:0.76rem; color:#9ca3af; margin:0; font-style:italic; }

    @media (max-width:700px) {
      .adm-layout { grid-template-columns:1fr; }
    }
  `]
})
export class AdministrationComponent implements OnInit {
  private admin = inject(AdminService);
  private escalation = inject(EscalationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activeSection = signal<AdminSection>('severity');
  leftNav = LEFT_NAV;

  categories     = signal<Category[]>([]);
  severityLevels = signal<SeverityLevel[]>([]);
  sortedSeverityLevels = computed(() =>
    this.severityLevels()
      .map(s => this.enrichSeverity(s))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  );
  departments    = signal<Department[]>([]);
  priorities     = signal<Priority[]>([]);
  roles          = signal<RoleCard[]>([]);
  users          = signal<AdminUser[]>([]);
  usersLoading   = signal(false);
  userSearch     = signal('');
  assigningUserId = signal<string | null>(null);
  factories      = signal<AdminFactory[]>([]);
  factoryLines   = signal<AdminLine[]>([]);
  selectedFactoryId = signal<string | null>(null);
  notifTemplates = signal<AdminNotificationTemplate[]>([]);
  escRules       = signal<EscalationRuleDto[]>([]);
  error          = signal<string | null>(null);

  showCatForm  = signal(false);
  newCatName   = '';
  showDeptForm = signal(false);
  newDept      = { name: '', manager: '', location: '' };
  showRuleForm = signal(false);
  newRule      = { name: '', triggerAfterMinutes: 120, channelsRaw: '', recipientsRaw: '' };
  showNewTemplateForm = signal(false);
  newTemplate  = { triggerEvent: '', channelsRaw: 'Email', subjectTemplate: '', bodyTemplate: '' };

  filteredUsers = computed(() => {
    const q = this.userSearch().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  totalUserCount(): number {
    return this.roles().reduce((sum, r) => sum + r.userCount, 0);
  }

  ngOnInit(): void {
    this.applySectionFromRoute();
    this.route.queryParamMap.subscribe(() => this.applySectionFromRoute());
    this.loadAll();
  }

  private applySectionFromRoute(): void {
    const section = this.route.snapshot.queryParamMap.get('section') as AdminSection | null;
    if (section && LEFT_NAV.some(n => n.id === section)) {
      this.activeSection.set(section);
      return;
    }
    if (!section) {
      this.activeSection.set('severity');
    }
  }

  selectSection(id: AdminSection): void {
    this.activeSection.set(id);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private loadAll(): void {
    this.admin.getCategories().subscribe({
      next: rows => this.categories.set(rows),
      error: () => this.error.set('Failed to load categories.'),
    });
    this.admin.getSeverityLevels().subscribe({
      next: rows => this.severityLevels.set(rows),
      error: () => this.error.set('Failed to load severity levels.'),
    });
    this.admin.getDepartments().subscribe({
      next: rows => this.departments.set(rows),
      error: () => this.error.set('Failed to load departments.'),
    });
    this.admin.getPriorities().subscribe({
      next: rows => this.priorities.set(rows),
      error: () => this.error.set('Failed to load priorities.'),
    });
    this.admin.getRoles().subscribe({
      next: rows => this.roles.set(rows.map(r => {
        const colors = ROLE_BADGE_COLORS[r.code] ?? { color: '#374151', bg: '#f3f4f6' };
        return {
          id: r.id,
          code: r.code,
          label: r.label || r.code,
          badgeColor: colors.color,
          badgeBg: colors.bg,
          userCount: r.userCount,
          permissions: r.permissions,
        };
      })),
      error: () => this.error.set('Failed to load roles.'),
    });
    this.admin.getFactories().subscribe({
      next: rows => this.factories.set(rows),
      error: () => this.error.set('Failed to load factories.'),
    });
    this.admin.getNotificationTemplates().subscribe({
      next: rows => this.notifTemplates.set(rows),
      error: () => this.error.set('Failed to load notification templates.'),
    });
    this.escalation.getRules().subscribe({
      next: rows => this.escRules.set(rows),
      error: () => this.error.set('Failed to load escalation rules.'),
    });
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersLoading.set(true);
    this.admin.getUsers().subscribe({
      next: rows => {
        this.users.set(rows);
        this.usersLoading.set(false);
      },
      error: () => {
        this.usersLoading.set(false);
        this.error.set('Failed to load users.');
      },
    });
  }

  assignUserRole(user: AdminUser, roleId: string): void {
    if (!roleId || roleId === user.roleId) return;
    const role = this.roles().find(r => r.id === roleId);
    if (!role) return;

    this.assigningUserId.set(user.id);
    this.admin.assignRole(user.id, roleId).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id
          ? { ...u, roleId, role: role.code, roleLabel: role.label }
          : u));
        this.assigningUserId.set(null);
        this.admin.getRoles().subscribe({
          next: rows => this.roles.set(rows.map(r => {
            const colors = ROLE_BADGE_COLORS[r.code] ?? { color: '#374151', bg: '#f3f4f6' };
            return {
              id: r.id,
              code: r.code,
              label: r.label || r.code,
              badgeColor: colors.color,
              badgeBg: colors.bg,
              userCount: r.userCount,
              permissions: r.permissions,
            };
          })),
        });
      },
      error: () => {
        this.assigningUserId.set(null);
        this.error.set(`Failed to assign role for ${user.email}.`);
      },
    });
  }

  // ── Factory Structure ──
  toggleFactory(f: AdminFactory): void {
    if (this.selectedFactoryId() === f.id) {
      this.selectedFactoryId.set(null);
      return;
    }
    this.selectedFactoryId.set(f.id);
    this.factoryLines.set([]);
    this.admin.getFactoryLines(f.id).subscribe({
      next: lines => this.factoryLines.set(lines),
      error: () => this.error.set('Failed to load production lines.'),
    });
  }

  editFactory(f: AdminFactory): void {
    const name = prompt('Factory name:', f.name);
    if (name === null) return;
    const location = prompt('Location:', f.location) ?? f.location;
    this.admin.updateFactory(f.id, { name: name.trim(), location }).subscribe({
      next: () => this.factories.update(list => list.map(x => x.id === f.id ? { ...x, name: name.trim(), location } : x)),
      error: () => this.error.set('Failed to update factory.'),
    });
  }

  addLine(f: AdminFactory): void {
    const name = prompt(`Add a production line to "${f.name}":`);
    if (!name?.trim()) return;
    this.admin.addFactoryLine(f.id, name.trim()).subscribe({
      next: created => this.factoryLines.update(lines => [...lines, { id: created.id, name: created.name, active: true }]),
      error: () => this.error.set('Failed to add production line.'),
    });
  }

  // ── Notification Templates ──
  formatTriggerLabel(event: string): string {
    const map: Record<string, string> = {
      INCIDENT_CREATED:       'New Incident Report',
      INCIDENT_CRITICAL:      'Critical Incident Alert',
      INVESTIGATOR_ASSIGNED:  'Investigation Assigned',
      CAPA_DUE_REMINDER:      'CAPA Due Reminder',
      APPROVAL_REQUIRED:      'Approval Required',
      INCIDENT_CLOSED:        'Incident Closure',
      SLA_WARNING:            'SLA Warning',
      SLA_BREACHED:           'SLA Breached',
      ESCALATION_FIRED:       'Escalation Fired',
      STATUS_CHANGED:         'Status Changed',
      EVIDENCE_UPLOADED:      'Evidence Uploaded',
    };
    return map[event] ?? event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  addTemplate(): void {
    if (!this.newTemplate.triggerEvent.trim()) return;
    this.error.set('Creating notification templates via API is not yet supported. Edit existing templates instead.');
    this.showNewTemplateForm.set(false);
  }

  toggleTemplate(t: AdminNotificationTemplate): void {
    const active = !t.active;
    this.admin.updateNotificationTemplate(t.id, { active }).subscribe({
      next: () => this.notifTemplates.update(list => list.map(x => x.id === t.id ? { ...x, active } : x)),
      error: () => this.error.set('Failed to update template status.'),
    });
  }

  editTemplate(t: AdminNotificationTemplate): void {
    const subjectTemplate = prompt('Subject template:', t.subjectTemplate);
    if (subjectTemplate === null) return;
    const bodyTemplate = prompt('Body template:', t.bodyTemplate) ?? t.bodyTemplate;
    const channelsRaw = prompt('Channels (comma-separated):', t.channels.join(', ')) ?? t.channels.join(', ');
    const channels = channelsRaw.split(',').map(s => s.trim()).filter(Boolean);
    this.admin.updateNotificationTemplate(t.id, { subjectTemplate: subjectTemplate.trim(), bodyTemplate, channels }).subscribe({
      next: () => this.notifTemplates.update(list => list.map(x => x.id === t.id
        ? { ...x, subjectTemplate: subjectTemplate.trim(), bodyTemplate, channels } : x)),
      error: () => this.error.set('Failed to update template.'),
    });
  }

  // ── Escalation Rules ──
  addRule(): void {
    if (!this.newRule.name.trim()) return;
    const body = {
      name: this.newRule.name.trim(),
      triggerAfterMinutes: Number(this.newRule.triggerAfterMinutes) || 120,
      channels: this.newRule.channelsRaw.split(',').map(s => s.trim()).filter(Boolean),
      recipients: this.newRule.recipientsRaw.split(',').map(s => s.trim()).filter(Boolean),
      active: true,
    };
    this.escalation.createRule(body).subscribe({
      next: created => {
        this.escRules.update(list => [...list, {
          id: created.id, name: created.name, description: '',
          triggerAfterMinutes: body.triggerAfterMinutes, channels: body.channels,
          recipients: body.recipients, active: true,
        }]);
        this.newRule = { name: '', triggerAfterMinutes: 120, channelsRaw: '', recipientsRaw: '' };
        this.showRuleForm.set(false);
      },
      error: () => this.error.set('Failed to create escalation rule.'),
    });
  }

  toggleRule(r: EscalationRuleDto): void {
    const active = !r.active;
    this.escalation.updateRule(r.id, { active }).subscribe({
      next: () => this.escRules.update(list => list.map(x => x.id === r.id ? { ...x, active } : x)),
      error: () => this.error.set('Failed to update rule.'),
    });
  }

  deleteRule(r: EscalationRuleDto): void {
    if (!confirm(`Delete escalation rule "${r.name}"?`)) return;
    this.escalation.deleteRule(r.id).subscribe({
      next: () => this.escRules.update(list => list.filter(x => x.id !== r.id)),
      error: () => this.error.set('Failed to delete rule.'),
    });
  }

  // ── Categories ──
  addCategory(): void {
    if (!this.newCatName.trim()) return;
    const name = this.newCatName.trim();
    this.admin.createCategory(name).subscribe({
      next: created => {
        this.categories.update(list => [...list, { id: created.id, name: created.name, active: true, subcategories: [] }]);
        this.newCatName = '';
        this.showCatForm.set(false);
      },
      error: () => this.error.set('Failed to create category.'),
    });
  }

  editCategory(cat: Category): void {
    const name = prompt('Category name:', cat.name);
    if (!name?.trim() || name.trim() === cat.name) return;
    this.admin.updateCategory(cat.id, { name: name.trim() }).subscribe({
      next: () => this.categories.update(list => list.map(c => c.id === cat.id ? { ...c, name: name.trim() } : c)),
      error: () => this.error.set('Failed to update category.'),
    });
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.admin.deleteCategory(cat.id).subscribe({
      next: () => this.categories.update(list => list.filter(c => c.id !== cat.id)),
      error: () => this.error.set('Failed to delete category.'),
    });
  }

  addSubcategory(cat: Category): void {
    const val = prompt(`Add sub-category to "${cat.name}":`);
    if (!val?.trim()) return;
    this.admin.addSubcategory(cat.id, val.trim()).subscribe({
      next: res => this.categories.update(list => list.map(c => c.id === cat.id ? { ...c, subcategories: res.subcategories } : c)),
      error: () => this.error.set('Failed to add sub-category.'),
    });
  }

  // ── Severity ──
  editSeverity(s: SeverityLevel): void {
    const label = prompt('Label:', s.label);
    if (label === null) return;
    const slaHoursRaw = prompt('SLA hours:', String(s.slaHours));
    if (slaHoursRaw === null) return;
    const slaHours = Number(slaHoursRaw);
    const autoEscalate = confirm('Auto-escalate on breach? OK = Yes, Cancel = No');
    this.admin.updateSeverityLevel(s.id, { label: label.trim(), slaHours, autoEscalate }).subscribe({
      next: () => this.severityLevels.update(list => list.map(x => x.id === s.id ? { ...x, label: label.trim(), slaHours, autoEscalate } : x)),
      error: () => this.error.set('Failed to update severity level.'),
    });
  }

  // ── Priorities ──
  editPriority(p: Priority): void {
    const label = prompt('Label:', p.label);
    if (!label?.trim()) return;
    this.admin.updatePriority(p.id, { label: label.trim() }).subscribe({
      next: () => this.priorities.update(list => list.map(x => x.id === p.id ? { ...x, label: label.trim() } : x)),
      error: () => this.error.set('Failed to update priority.'),
    });
  }

  // ── Departments ──
  addDepartment(): void {
    if (!this.newDept.name.trim()) return;
    const { name, manager, location } = this.newDept;
    this.admin.createDepartment(name.trim(), manager.trim(), location.trim()).subscribe({
      next: created => {
        this.departments.update(list => [...list, {
          id: created.id, name: created.name, manager: manager.trim(), location: location.trim(), active: true,
        }]);
        this.newDept = { name: '', manager: '', location: '' };
        this.showDeptForm.set(false);
      },
      error: () => this.error.set('Failed to create department.'),
    });
  }

  editDepartment(d: Department): void {
    const name = prompt('Department name:', d.name);
    if (name === null) return;
    const manager = prompt('Manager:', d.manager) ?? d.manager;
    const location = prompt('Location:', d.location) ?? d.location;
    this.admin.updateDepartment(d.id, { name: name.trim(), manager, location }).subscribe({
      next: () => this.departments.update(list => list.map(x => x.id === d.id ? { ...x, name: name.trim(), manager, location } : x)),
      error: () => this.error.set('Failed to update department.'),
    });
  }

  deleteDepartment(d: Department): void {
    if (!confirm(`Delete department "${d.name}"?`)) return;
    this.admin.deleteDepartment(d.id).subscribe({
      next: () => this.departments.update(list => list.filter(x => x.id !== d.id)),
      error: () => this.error.set('Failed to delete department.'),
    });
  }

  // ── Roles ──
  addRole(): void {
    const code = prompt('Role code (e.g. QUALITY_LEAD):');
    if (!code?.trim()) return;
    const label = prompt('Display label:', code.trim()) ?? code.trim();
    this.admin.createRole(code.trim().toUpperCase(), label, []).subscribe({
      next: created => {
        const colors = ROLE_BADGE_COLORS[created.code] ?? { color: '#374151', bg: '#f3f4f6' };
        this.roles.update(list => [...list, {
          id: created.id, code: created.code, label: created.label, badgeColor: colors.color, badgeBg: colors.bg, userCount: 0, permissions: [],
        }]);
      },
      error: () => this.error.set('Failed to create role — code may already exist.'),
    });
  }

  configureRole(role: RoleCard): void {
    const label = prompt('Role label:', role.label);
    if (label === null) return;
    const permsRaw = prompt('Permissions (comma-separated):', role.permissions.join(', ')) ?? role.permissions.join(', ');
    const permissions = permsRaw.split(',').map(s => s.trim()).filter(Boolean);
    this.admin.updateRole(role.id, label.trim(), permissions).subscribe({
      next: () => this.roles.update(list => list.map(r => r.id === role.id ? { ...r, label: label.trim(), permissions } : r)),
      error: () => this.error.set('Failed to update role.'),
    });
  }

  sectionTitle(): string {
    return LEFT_NAV.find(n => n.id === this.activeSection())?.label ?? '';
  }

  private enrichSeverity(s: SeverityLevel): SeverityDisplay {
    const ui = SEVERITY_UI[s.label];
    const codeOrder = parseInt(s.code.replace(/\D/g, ''), 10);
    return {
      ...s,
      description: ui?.description ?? `SLA: ${s.slaHours} hours. Auto-escalate: ${s.autoEscalate ? 'Yes' : 'No'}.`,
      responseText: ui?.responseText ?? this.formatSlaHours(s.slaHours),
      displayColor: ui?.color ?? s.color,
      sortOrder: ui?.sortOrder ?? (5 - codeOrder),
    };
  }

  private formatSlaHours(hours: number): string {
    if (hours < 1) {
      const mins = Math.round(hours * 60);
      return mins === 1 ? '1 minute' : `${mins} minutes`;
    }
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
}
