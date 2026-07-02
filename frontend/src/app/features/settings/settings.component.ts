import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

const ROLE_DISPLAY: Record<string, string> = {
  ADMIN: 'System Administrator',
  REPORTER: 'Reporter',
  APPROVER: 'Approver',
  RESOLVER: 'Resolver',
};

interface ProfileRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="settings-page">
  <div class="settings-hd">
    <h1 class="settings-title">Settings</h1>
    <p class="settings-sub">Manage your account and system preferences.</p>
  </div>

  <div class="settings-card">
    <h2 class="settings-card-title">Profile Settings</h2>

    @if (loading()) {
      <div class="settings-loading">Loading profile…</div>
    } @else {
      <div class="profile-rows">
        @for (row of profileRows(); track row.label) {
          <div class="profile-row">
            <span class="profile-label">{{ row.label }}</span>
            <span class="profile-value">{{ row.value }}</span>
          </div>
        }
      </div>
    }
  </div>
</div>
`,
  styles: [`
    .settings-page { padding:1.5rem 1.75rem 2rem; font-family:inherit; }

    .settings-hd { margin-bottom:1.5rem; }
    .settings-title {
      font-size:1.5rem; font-weight:700; color:#111827; margin:0 0 4px;
      letter-spacing:-0.01em;
    }
    .settings-sub { font-size:0.82rem; color:#9ca3af; margin:0; }

    .settings-card {
      background:#fff; border:1px solid #e5e7eb; border-radius:12px;
      padding:1.35rem 1.5rem; max-width:720px;
    }
    .settings-card-title {
      font-size:0.95rem; font-weight:700; color:#111827; margin:0 0 1rem;
    }

    .profile-rows { display:flex; flex-direction:column; }
    .profile-row {
      display:flex; align-items:center; justify-content:space-between; gap:1.5rem;
      padding:0.85rem 0; border-bottom:1px solid #f3f4f6;
    }
    .profile-row:last-child { border-bottom:none; padding-bottom:0; }
    .profile-row:first-child { padding-top:0; }
    .profile-label { font-size:0.84rem; color:#6b7280; font-weight:500; flex-shrink:0; }
    .profile-value {
      font-size:0.84rem; font-weight:700; color:#111827; text-align:right;
    }

    .settings-loading {
      padding:1.5rem 0; font-size:0.82rem; color:#9ca3af; text-align:center;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);

  loading = signal(true);
  profileRows = signal<ProfileRow[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    this.auth.refreshProfile().subscribe({
      next: () => {
        this.profileRows.set(this.buildRows());
        this.loading.set(false);
      },
      error: () => {
        this.profileRows.set(this.buildRows());
        this.loading.set(false);
      },
    });
  }

  private buildRows(): ProfileRow[] {
    const roleCode = (this.auth.currentRole() ?? '').toUpperCase();
    const roleLabel = this.auth.currentRoleLabel() ?? ROLE_DISPLAY[roleCode] ?? roleCode;

    return [
      { label: 'Full Name', value: this.auth.currentName() ?? this.displayNameFromEmail() },
      { label: 'Email', value: this.auth.currentEmail() ?? '—' },
      {
        label: 'Factory',
        value: this.formatFactory(
          this.auth.currentFactoryName() ?? undefined,
          this.auth.currentFactoryLocation() ?? undefined,
        ),
      },
      { label: 'Role', value: ROLE_DISPLAY[roleCode] ?? roleLabel },
    ];
  }

  private formatFactory(name?: string, location?: string): string {
    if (!name) return '—';
    if (!location) return name;
    const city = location.split(/\s+/)[0];
    return `${name} — ${city}`;
  }

  private displayNameFromEmail(): string {
    const email = this.auth.currentEmail();
    if (!email) return 'User';
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[._-]/g, ' ');
  }
}
