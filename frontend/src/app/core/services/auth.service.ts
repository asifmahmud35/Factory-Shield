import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface LoginResponse {
  token: string;
  role: string;
}

export interface MeResponse {
  userId: string;
  email: string;
  role: string;
  name: string;
  roleLabel: string;
  factoryName?: string | null;
  factoryLocation?: string | null;
}

const TOKEN_KEY = 'fs_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal<string | null>(null);
  private _role = signal<string | null>(null);
  private _email = signal<string | null>(null);
  private _name = signal<string | null>(null);
  private _roleLabel = signal<string | null>(null);
  private _factoryName = signal<string | null>(null);
  private _factoryLocation = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly currentRole = this._role.asReadonly();
  readonly currentEmail = this._email.asReadonly();
  readonly currentName = this._name.asReadonly();
  readonly currentRoleLabel = this._roleLabel.asReadonly();
  readonly currentFactoryName = this._factoryName.asReadonly();
  readonly currentFactoryLocation = this._factoryLocation.asReadonly();

  private http = inject(HttpClient);
  private router = inject(Router);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/v1/auth/login', { email, password }).pipe(
      tap(res => {
        this._token.set(res.token);
        this._role.set(res.role);
        this._email.set(email);
        this._name.set(null);
        this._roleLabel.set(null);
        this._factoryName.set(null);
        this._factoryLocation.set(null);
        this.persistToken(res.token);
        this.refreshProfile().subscribe();
      })
    );
  }

  logout(): void {
    this._token.set(null);
    this._role.set(null);
    this._email.set(null);
    this._name.set(null);
    this._roleLabel.set(null);
    this._factoryName.set(null);
    this._factoryLocation.set(null);
    this.persistToken(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  /**
   * On app boot, rehydrate the session from a persisted token so a page
   * refresh (or direct-URL navigation) doesn't drop the user to /login.
   * The token is validated against /auth/me; if it's expired/invalid we
   * clear it and stay logged out.
   */
  restoreSession(): Promise<void> {
    if (this._token() !== null) return Promise.resolve();

    const stored = this.readToken();
    if (!stored) return Promise.resolve();

    // Set the token first so the interceptor attaches it to /auth/me.
    this._token.set(stored);

    return new Promise(resolve => {
      this.http.get<MeResponse>('/api/v1/auth/me').subscribe({
        next: me => {
          this._role.set(me.role);
          this._email.set(me.email);
          this._name.set(me.name);
          this._roleLabel.set(me.roleLabel);
          this._factoryName.set(me.factoryName ?? null);
          this._factoryLocation.set(me.factoryLocation ?? null);
          resolve();
        },
        error: () => {
          // Token rejected (expired/invalid) — clear it and stay logged out.
          this._token.set(null);
          this.persistToken(null);
          resolve();
        },
      });
    });
  }

  private persistToken(token: string | null): void {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch { /* localStorage unavailable (private mode) — session stays in-memory only */ }
  }

  private readToken(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); }
    catch { return null; }
  }

  /** Loads profile fields from /auth/me (safe to call after login). */
  refreshProfile(): Observable<MeResponse> {
    return this.http.get<MeResponse>('/api/v1/auth/me').pipe(
      tap(me => {
        this._role.set(me.role);
        this._email.set(me.email);
        this._name.set(me.name);
        this._roleLabel.set(me.roleLabel);
        this._factoryName.set(me.factoryName ?? null);
        this._factoryLocation.set(me.factoryLocation ?? null);
      }),
    );
  }
}
