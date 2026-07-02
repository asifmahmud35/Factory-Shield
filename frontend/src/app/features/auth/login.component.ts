import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-split">

      <!-- Left: hero panel -->
      <div class="login-hero">
        <div class="login-hero__top">
          <div class="login-hero__brand">
            <div class="login-hero__logo">⚙</div>
            <div>
              <div class="login-hero__name">FactoryShield</div>
              <div class="login-hero__platform">Ready-Made Factory Safety Platform</div>
            </div>
          </div>

          <div class="login-hero__badge">⚠ Incident Management System</div>

          <h1 class="login-hero__headline">
            Protect Your Factory.<br>Prevent Every Incident.
          </h1>
          <p class="login-hero__sub">
            Enterprise-grade incident tracking, investigation, root cause
            analysis, and corrective action management built for factory facilities.
          </p>
        </div>

        <div class="login-hero__bottom">
          <div class="login-hero__stats">
            <div class="login-stat">
              <div class="login-stat__value">98.4%</div>
              <div class="login-stat__label">Closure Rate</div>
            </div>
            <div class="login-stat">
              <div class="login-stat__value">4.2h</div>
              <div class="login-stat__label">Avg Response Time</div>
            </div>
            <div class="login-stat">
              <div class="login-stat__value">2,400+</div>
              <div class="login-stat__label">Incidents Resolved</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: form panel -->
      <div class="login-form-panel">
        <div class="login-form-wrap">
          <h2 class="login-form__title">Welcome back</h2>
          <p class="login-form__sub">Sign in to your incident management portal</p>

          <div class="login-demo-box">
            <div class="login-demo-box__icon">i</div>
            <div>
              <div class="login-demo-box__title">Demo Access</div>
              <div class="login-demo-box__hint">Use the credentials below to log in</div>
              <div class="login-demo-box__cred">Email: <code>reporter&#64;factoryshield.dev</code></div>
              <div class="login-demo-box__cred">Password: <code>Reporter123!</code></div>
            </div>
          </div>

          <form (ngSubmit)="login()">
            <div class="form-group">
              <label class="form-label" for="email">Email Address</label>
              <div class="input-icon-wrap">
                <span class="input-icon">✉</span>
                <input id="email" class="form-control form-control--icon" type="email"
                  [(ngModel)]="email" name="email" required
                  placeholder="your@email.com">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <div class="input-icon-wrap">
                <span class="input-icon">🔒</span>
                <input id="password" class="form-control form-control--icon" type="password"
                  [(ngModel)]="password" name="password" required
                  placeholder="••••••••">
              </div>
            </div>

            @if (error) {
              <div class="alert alert-error">{{ error }}</div>
            }

            <button class="btn btn-cta btn-full" type="submit" [disabled]="loading">
              {{ loading ? 'Signing in…' : 'Sign In to Portal' }}
            </button>
          </form>

          <p class="login-form__footer">
            Don't have an account? <span class="login-form__link">Contact your administrator</span>
          </p>
          <p class="login-form__version">FactoryShield v1.0 — Factory Incident Management Platform</p>
        </div>
      </div>

    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.loading = true;
    this.error = '';
    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.error ?? 'Invalid email or password.';
        this.loading = false;
      }
    });
  }
}
