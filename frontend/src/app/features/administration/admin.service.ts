import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminRole {
  id: string; code: string; label: string; userCount: number; permissions: string[];
}
export interface AdminUser {
  id: string; name: string; email: string; isActive: boolean; role: string; roleId: string; roleLabel: string;
}
export interface AdminCategory {
  id: string; name: string; active: boolean; subcategories: string[];
}
export interface AdminDepartment {
  id: string; name: string; manager: string; location: string; active: boolean;
}
export interface AdminSeverityLevel {
  id: string; code: string; label: string; color: string; slaHours: number; autoEscalate: boolean;
}
export interface AdminPriority {
  id: string; code: string; label: string; color: string;
}
export interface AdminFactory {
  id: string; name: string; location: string; active: boolean;
}
export interface AdminLine {
  id: string; name: string; active: boolean;
}
export interface AdminNotificationTemplate {
  id: string; triggerEvent: string; channels: string[]; subjectTemplate: string; bodyTemplate: string; active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = '/api/v1/admin';

  // ── Roles ──
  getRoles(): Observable<AdminRole[]> { return this.http.get<AdminRole[]>(`${this.base}/roles`); }
  createRole(code: string, label: string, permissions: string[]): Observable<{ id: string; code: string; label: string }> {
    return this.http.post<{ id: string; code: string; label: string }>(`${this.base}/roles`, { code, label, permissions });
  }
  updateRole(id: string, label?: string, permissions?: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/roles/${id}`, { label, permissions });
  }
  deleteRole(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/roles/${id}`); }

  // ── Users ──
  getUsers(): Observable<AdminUser[]> { return this.http.get<AdminUser[]>(`${this.base}/users`); }
  assignRole(userId: string, roleId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${userId}/roles`, { roleId });
  }
  removeRole(userId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${userId}/roles/${roleId}`);
  }

  // ── Categories ──
  getCategories(): Observable<AdminCategory[]> { return this.http.get<AdminCategory[]>(`${this.base}/categories`); }
  createCategory(name: string, active = true, subcategories: string[] = []): Observable<{ id: string; name: string }> {
    return this.http.post<{ id: string; name: string }>(`${this.base}/categories`, { name, active, subcategories });
  }
  updateCategory(id: string, patch: Partial<{ name: string; active: boolean; subcategories: string[] }>): Observable<void> {
    return this.http.put<void>(`${this.base}/categories/${id}`, patch);
  }
  deleteCategory(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/categories/${id}`); }
  addSubcategory(categoryId: string, name: string): Observable<{ subcategories: string[] }> {
    return this.http.post<{ subcategories: string[] }>(`${this.base}/categories/${categoryId}/subcategories`, { name });
  }
  removeSubcategory(categoryId: string, name: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${categoryId}/subcategories/${encodeURIComponent(name)}`);
  }

  // ── Departments ──
  getDepartments(): Observable<AdminDepartment[]> { return this.http.get<AdminDepartment[]>(`${this.base}/departments`); }
  createDepartment(name: string, manager?: string, location?: string, active = true): Observable<{ id: string; name: string }> {
    return this.http.post<{ id: string; name: string }>(`${this.base}/departments`, { name, manager, location, active });
  }
  updateDepartment(id: string, patch: Partial<{ name: string; manager: string; location: string; active: boolean }>): Observable<void> {
    return this.http.put<void>(`${this.base}/departments/${id}`, patch);
  }
  deleteDepartment(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/departments/${id}`); }

  // ── Severity & Priority ──
  getSeverityLevels(): Observable<AdminSeverityLevel[]> { return this.http.get<AdminSeverityLevel[]>(`${this.base}/severity-levels`); }
  updateSeverityLevel(id: string, patch: Partial<{ label: string; color: string; slaHours: number; autoEscalate: boolean }>): Observable<void> {
    return this.http.put<void>(`${this.base}/severity-levels/${id}`, patch);
  }
  getPriorities(): Observable<AdminPriority[]> { return this.http.get<AdminPriority[]>(`${this.base}/priorities`); }
  updatePriority(id: string, patch: Partial<{ label: string; color: string }>): Observable<void> {
    return this.http.put<void>(`${this.base}/priorities/${id}`, patch);
  }

  // ── Factories & Lines ──
  getFactories(): Observable<AdminFactory[]> { return this.http.get<AdminFactory[]>(`${this.base}/factories`); }
  updateFactory(id: string, patch: Partial<{ name: string; location: string; active: boolean }>): Observable<void> {
    return this.http.put<void>(`${this.base}/factories/${id}`, patch);
  }
  getFactoryLines(factoryId: string): Observable<AdminLine[]> {
    return this.http.get<AdminLine[]>(`${this.base}/factories/${factoryId}/lines`);
  }
  addFactoryLine(factoryId: string, name: string, active = true): Observable<{ id: string; name: string }> {
    return this.http.post<{ id: string; name: string }>(`${this.base}/factories/${factoryId}/lines`, { name, active });
  }

  // ── Notification Templates ──
  getNotificationTemplates(): Observable<AdminNotificationTemplate[]> {
    return this.http.get<AdminNotificationTemplate[]>(`${this.base}/notification-templates`);
  }
  updateNotificationTemplate(id: string, patch: Partial<{ channels: string[]; subjectTemplate: string; bodyTemplate: string; active: boolean }>): Observable<void> {
    return this.http.put<void>(`${this.base}/notification-templates/${id}`, patch);
  }
}
