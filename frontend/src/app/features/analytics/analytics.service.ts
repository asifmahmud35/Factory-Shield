import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalyticsKpi {
  period: string;
  totalIncidents: number;
  totalIncidentsTrend: number;
  avgResolutionHours: number;
  avgResolutionTrend: number;
  slaCompliancePct: number;
  slaComplianceTrend: number;
  recurringRatePct: number;
  recurringRateTrend: number;
}

export interface IncidentTrendPoint {
  month: string;
  reported: number;
}

export interface DepartmentPerformance {
  dept: string;
  incidents: number;
  resolved: number;
}

export interface SeverityDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RecurringIssue {
  rank: number;
  title: string;
  department: string;
  count: number;
  trend: number;
}

export interface RootCauseItem {
  category: string;
  count: number;
  pct: number;
}

export interface ClosureRatePoint {
  month: string;
  reported: number;
  closed: number;
  closureRatePct: number;
}

export interface ResolutionTimeGroup {
  group: string;
  avgHours: number;
  count: number;
}

export interface ResolutionTimeBreakdown {
  overallAvgHours: number;
  byDepartment: ResolutionTimeGroup[];
  bySeverity: ResolutionTimeGroup[];
  byCategory: ResolutionTimeGroup[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = '/api/v1/analytics';

  getKpi(period = '6m'): Observable<AnalyticsKpi> {
    return this.http.get<AnalyticsKpi>(`${this.base}/kpi`, { params: { period } });
  }

  getIncidentTrend(period = '6m'): Observable<IncidentTrendPoint[]> {
    return this.http.get<IncidentTrendPoint[]>(`${this.base}/incident-trend`, { params: { period } });
  }

  getDepartmentPerformance(period = '6m'): Observable<DepartmentPerformance[]> {
    return this.http.get<DepartmentPerformance[]>(`${this.base}/department-performance`, { params: { period } });
  }

  getSeverityDistribution(period = '6m'): Observable<SeverityDistribution> {
    return this.http.get<SeverityDistribution>(`${this.base}/severity-distribution`, { params: { period } });
  }

  getRecurringIssues(period = '6m'): Observable<RecurringIssue[]> {
    return this.http.get<RecurringIssue[]>(`${this.base}/recurring-issues`, { params: { period } });
  }

  getRootCauseDistribution(period = '6m'): Observable<RootCauseItem[]> {
    return this.http.get<RootCauseItem[]>(`${this.base}/root-cause-distribution`, { params: { period } });
  }

  getClosureRate(period = '6m'): Observable<ClosureRatePoint[]> {
    return this.http.get<ClosureRatePoint[]>(`${this.base}/closure-rate`, { params: { period } });
  }

  getResolutionTime(period = '6m'): Observable<ResolutionTimeBreakdown> {
    return this.http.get<ResolutionTimeBreakdown>(`${this.base}/resolution-time`, { params: { period } });
  }

  exportPdf(period = '6m'): Observable<Blob> {
    return this.http.get(`${this.base}/export/pdf`, { params: { period }, responseType: 'blob' });
  }

  exportExcel(period = '6m'): Observable<Blob> {
    return this.http.get(`${this.base}/export/excel`, { params: { period }, responseType: 'blob' });
  }
}
