import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Checks authentication always. If the matched route (or any of its ancestors) declares
 * `data: { roles: [...] }`, also checks the current user's role against that list — keep
 * each list in sync with the backend policy guarding the corresponding endpoint(s), so a
 * wrong-role user is redirected here instead of hitting a page that only shows 403 errors.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as string[] | undefined;
  if (allowedRoles?.length) {
    const role = (authService.currentRole() ?? '').toUpperCase();
    if (!allowedRoles.includes(role)) {
      return router.createUrlTree(['/dashboard']);
    }
  }

  return true;
};

/** Matches the backend's `GovernanceOnly` policy — keep in sync with Program.cs. */
const ANALYTICS_ROLES = new Set([
  'APPROVER', 'ADMIN',
]);

/** Analytics data requires the GovernanceOnly policy server-side — reject other roles before they hit a wall of 403s. */
export const analyticsGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (ANALYTICS_ROLES.has((authService.currentRole() ?? '').toUpperCase())) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
