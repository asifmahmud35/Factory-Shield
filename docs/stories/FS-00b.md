# Story FS-00b: Authentication

**Status:** Done
**Epic source:** N/A (foundation story, not from PRD)
**Depends on:** FS-00 (Done)
**Blocks:** FS-01 and everything after

---

## Story

As a developer, I want JWT-based authentication working end-to-end (API issues tokens, Angular stores and attaches them, protected routes redirect correctly), so that every later story can be built behind real role-based access instead of mocked auth.

## Acceptance Criteria

1. Given valid credentials posted to `POST /api/v1/auth/login`, then the API returns a JWT access token plus the user's role claim.
2. Given invalid credentials, then the API returns 401 with no token.
3. Given the database is seeded, then 3 demo users exist: one Reporter, one Approver, one Resolver, each correctly linked to a role.
4. Given Angular's login page, when valid credentials are submitted, then the JWT is received and stored in app state, and the user is redirected to a placeholder dashboard route.
5. Given an unauthenticated user navigates to a protected route, then `role.guard.ts` redirects them to `/login`.
6. Given an authenticated user makes any API call, then `auth.interceptor.ts` attaches the Bearer token automatically — verify by inspecting a network request header in browser dev tools.

## Tasks / Subtasks

- [x] Add ASP.NET Core Identity to Infrastructure, configure password hasher
- [x] Implement JWT issuing service — token generation including role claim
- [x] `POST /api/v1/auth/login` endpoint (Application: `LoginCommand` + Handler via MediatR, Api: `AuthController`)
- [x] Seed 3 demo users (Reporter, Approver, Resolver) with roles — run only in Development environment
- [x] Angular: `auth.service.ts` — login call, token storage (in-memory service state, NOT localStorage — see Dev Notes), current-user state
- [x] Angular: login page (standalone component), simple form
- [x] Angular: `auth.interceptor.ts` — attaches Bearer token to outgoing requests
- [x] Angular: `role.guard.ts` — blocks unauthenticated navigation, redirects to `/login`
- [x] Wire one placeholder protected route (e.g. `/dashboard`) guarded by `role.guard.ts` to prove the redirect actually works
- [x] Manually verify all 6 Acceptance Criteria

## Dev Notes

Don't build the full RBAC policy matrix from architecture.md §6 yet — that gets enforced incrementally as each persona's endpoints are built (FS-04 onward for Approver, FS-07 onward for Resolver). For FS-00b, only prove the auth pipe end-to-end: login → token → guard → interceptor.

Token storage in Angular: keep it in a service-level state (signal or BehaviorSubject), not `localStorage` — avoids basic XSS token theft. This is an acceptable MVP tradeoff given the deadline; full refresh-token/httpOnly-cookie pattern is out of scope and already documented as a stub in architecture.md §11.

## Definition of Done

- [x] All acceptance criteria above pass manually
- [x] Status updated to `Done` at the top of this file
- [x] (git commit deferred — batching at end of Day 1 per project plan)
