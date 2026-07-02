import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WhyEntryDto {
  order: number;
  text: string;
}

export interface FishboneCategoriesDto {
  man: string;
  machine: string;
  method: string;
  material: string;
  environment: string;
  management: string;
}

export interface RcaDto {
  incidentId: string;
  incidentReference: string;
  method: string | null;
  problemStatement: string | null;
  whyEntries: WhyEntryDto[];
  fishboneCategories: FishboneCategoriesDto;
  structuredCategory: string | null;
  structuredDescription: string | null;
  structuredContributing: string | null;
  structuredVerification: string | null;
  structuredLessons: string | null;
  rootCauseStatement: string | null;
  checklistCompleted: string[];
  status: string;
  submittedAt: string | null;
}

export interface RcaRecommendationsDto {
  problemStatement: string;
  whySuggestions: string[];
  structuredDescription: string;
  structuredCategory: string;
  fishboneSuggestions: FishboneCategoriesDto;
  checklistToComplete: string[];
}

export interface SimilarIncidentDto {
  incidentReference: string;
  title: string;
  category: string;
  createdAt: string;
  matchPercent: number;
}

export interface SaveRcaRequest {
  method?: string | null;
  problemStatement?: string | null;
  whyEntries?: WhyEntryDto[];
  fishboneCategories?: FishboneCategoriesDto;
  structuredCategory?: string | null;
  structuredDescription?: string | null;
  structuredContributing?: string | null;
  structuredVerification?: string | null;
  structuredLessons?: string | null;
  rootCauseStatement?: string | null;
  checklistCompleted?: string[];
}

@Injectable({ providedIn: 'root' })
export class RcaService {
  private http = inject(HttpClient);

  getRca(incidentId: string): Observable<RcaDto> {
    return this.http.get<RcaDto>(`/api/v1/incidents/${incidentId}/rca`);
  }

  getRecommendations(incidentId: string): Observable<RcaRecommendationsDto> {
    return this.http.get<RcaRecommendationsDto>(`/api/v1/incidents/${incidentId}/rca/recommendations`);
  }

  getSimilarIncidents(incidentId: string): Observable<SimilarIncidentDto[]> {
    return this.http.get<SimilarIncidentDto[]>(`/api/v1/incidents/${incidentId}/rca/similar`);
  }

  saveRca(incidentId: string, body: SaveRcaRequest): Observable<void> {
    return this.http.put<void>(`/api/v1/incidents/${incidentId}/rca`, body);
  }

  submitRca(incidentId: string): Observable<void> {
    return this.http.post<void>(`/api/v1/incidents/${incidentId}/rca/submit`, {});
  }
}
