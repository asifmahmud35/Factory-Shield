# Story FS-Auth-Extended: Complete Authentication System

**Status:** Done
**Epic source:** N/A (foundation feature, extends FS-00b)
**Depends on:** FS-00b (Done)
**Blocks:** none (optional polish, can be done in parallel with FS-03b/FS-04)

---

## Story

As a developer, I want the authentication system to be complete: current user retrieval (for page refresh), explicit logout, and better error messages — so the app feels like a real system, not a demo.

## Acceptance Criteria

1. Given an authenticated user with a valid JWT, when I `GET /api/v1/auth/me`, then the API returns HTTP 200 with `{"userId", "email", "role"}`.
2. Given an unauthenticated request to `GET /api/v1/auth/me`, then the API returns HTTP 401.
3. Given invalid credentials on login, then `POST /api/v1/auth/login` returns HTTP 401 with a clear message (e.g., `{"error": "Invalid email or password."}`), not a generic 401.
4. Given a logged-in user, when I `POST /api/v1/auth/logout`, then the API returns HTTP 200 and the user is effectively logged out on the frontend (token cleared from service state).
5. Given the Angular app, when a user logs out, then they are redirected to `/login` and cannot navigate back to protected routes without re-logging in.
6. Given the Angular `AuthService`, when the app loads and there's no in-memory token, then it attempts `GET /api/v1/auth/me` to restore the session (if the server still has it); if that fails with 401, the user stays logged out.

## Tasks / Subtasks

- [x] Api: `POST /api/v1/auth/logout` — no-op on backend (stateless JWT), just returns 200 (logout is client-side for MVP, no session revocation list)
- [x] Api: `GET /api/v1/auth/me` — extract `sub` from JWT, query user by ID, return `{userId, email, role}`; `[Authorize]`, 401 if not authenticated
- [x] Backend: improve error messages on login failure — return `{"error": "Invalid email or password."}` instead of generic 401
- [x] Angular: extend `AuthService` — add `logout()` method that clears token/role signals and navigates to `/login`
- [x] Angular: `LoginComponent` — on login failure, show the error message from the API response (not just "failed")
- [x] Angular: `app initialization` (in `main.ts` or `app.config.ts`) — on app load, if no in-memory token, call `AuthService.restoreSession()` which attempts `GET /api/v1/auth/me`; on success, restore token+role; on 401, stay logged out
- [x] Angular: wire logout button in the shared layout shell (from FS-03b) to call `AuthService.logout()`
- [x] Manually verify all 6 Acceptance Criteria

## Dev Notes

**Logout pattern:** Stateless JWT means the backend has nothing to revoke — logout is purely client-side (clear token). If we wanted proper revocation (blacklist, token invalidation on backend), that's out of scope for MVP per architecture.md §11. Accept this tradeoff: a leaked token is valid until it expires (default 60 min), no way to force it invalid mid-session.

**Session restore on app load:** The `restoreSession()` call on app init is optional — if skipped, user just stays logged out after refresh (acceptable MVP behavior). If done, adds polish: users won't need to re-login just because they refreshed the page mid-session.

## Definition of Done

- [x] All acceptance criteria above pass manually
- [x] Status updated to `Done` at the top of this file
- [ ] (git commit deferred — batching at end of Day 1 per project plan)
