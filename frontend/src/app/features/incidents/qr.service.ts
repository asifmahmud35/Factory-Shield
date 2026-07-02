import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QrContextDto {
  qrCodeId: string;
  qrType: string;
  factoryId?: string;
  sectionId?: string;
  lineId?: string;
  machineId?: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class QrService {
  private http = inject(HttpClient);

  getContext(code: string): Observable<QrContextDto> {
    return this.http.get<QrContextDto>(`/api/v1/qr/${code}`);
  }
}
