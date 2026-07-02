import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QrService, QrContextDto } from '../qr.service';

@Component({
  selector: 'app-qr-scan',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb;padding:1rem;">
      <div style="text-align:center;max-width:380px;width:100%">

        @if (loading()) {
          <div style="color:#6b7280;font-size:0.9rem">
            <div style="width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#6d28d9;
              border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem"></div>
            Loading QR context…
          </div>
        }

        @if (error()) {
          <div style="background:#fee2e2;border:1px solid #fecaca;border-radius:10px;padding:1.5rem">
            <div style="font-size:1.2rem;margin-bottom:0.5rem">⚠️</div>
            <div style="font-weight:600;color:#991b1b;margin-bottom:0.25rem">QR Code Not Found</div>
            <div style="font-size:0.8rem;color:#7f1d1d">{{ error() }}</div>
            <button style="margin-top:1rem;padding:0.5rem 1.25rem;background:#6d28d9;color:#fff;
              border:none;border-radius:6px;cursor:pointer;font-size:0.82rem"
              (click)="router.navigate(['/report'])">Report Without QR</button>
          </div>
        }

        @if (context()) {
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;box-shadow:0 2px 8px rgba(0,0,0,.06)">
            <div style="width:52px;height:52px;background:#f5f3ff;border-radius:12px;
              display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/>
                <rect width="5" height="5" x="3" y="16" rx="1"/>
                <path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                <path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/>
              </svg>
            </div>
            <div style="font-size:1rem;font-weight:700;color:#111827;margin-bottom:0.25rem">
              {{ context()!.label }}
            </div>
            <div style="font-size:0.72rem;color:#6b7280;margin-bottom:1.25rem">
              {{ context()!.qrType | titlecase }}
              @if (context()!.lineId) { · {{ context()!.lineId }} }
              @if (context()!.machineId) { · {{ context()!.machineId }} }
            </div>
            <p style="font-size:0.78rem;color:#374151;margin-bottom:1.5rem;line-height:1.5">
              You scanned a safety QR code. Tap below to report an incident at this location — details will be pre-filled.
            </p>
            <button style="width:100%;padding:0.7rem;background:#6d28d9;color:#fff;border:none;
              border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer"
              (click)="proceed()">
              Report Incident Here
            </button>
            <button style="width:100%;margin-top:0.6rem;padding:0.6rem;background:#f9fafb;color:#374151;
              border:1px solid #e5e7eb;border-radius:8px;font-size:0.82rem;cursor:pointer"
              (click)="router.navigate(['/report'])">
              Report Without Pre-fill
            </button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class QrScanComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private qrService = inject(QrService);
  router = inject(Router);

  loading = signal(true);
  context = signal<QrContextDto | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    this.qrService.getContext(code).subscribe({
      next: ctx => {
        this.context.set(ctx);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.error ?? 'QR code is invalid or inactive.');
        this.loading.set(false);
      }
    });
  }

  proceed(): void {
    const ctx = this.context();
    if (!ctx) return;
    this.router.navigate(['/report'], {
      state: {
        qrContext: {
          qrCodeId: ctx.qrCodeId,
          label: ctx.label,
          department: ctx.lineId ?? ctx.sectionId ?? null,
          machineId: ctx.machineId ?? null,
        }
      }
    });
  }
}
