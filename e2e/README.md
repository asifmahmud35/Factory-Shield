# E2E tests (Playwright)

Golden-path UI automation: Reporter creates an incident → Approver approves
and assigns a Resolver → Resolver completes the investigation checklist,
submits RCA, adds + completes a CAPA action, and resolves the incident.

## Prerequisites

1. Postgres running with the dev connection string configured in
   `src/FactoryShield.Api/appsettings.Development.json`.
2. The API running with the dev seeder applied (demo users are created on
   startup in the Development environment):
   ```
   dotnet run --project src/FactoryShield.Api
   ```
   It must be reachable at `http://localhost:5263` (matches `frontend/proxy.json`).

Playwright starts the Angular dev server itself (`npm start` in `frontend/`,
proxied to the API above) — you don't need to run `ng serve` separately.

## Running

```
npm run test:e2e            # headless
npm run test:e2e:headed     # watch it run in a browser
npm run test:e2e:report     # open the last HTML report
```

## Notes

- Tests run against the seeded demo accounts (`reporter@factoryshield.dev`,
  `approver@factoryshield.dev`, `resolver@factoryshield.dev`). Re-running
  the suite creates a new incident each time, so it's safe to run repeatedly
  against the same database.
- Not yet wired into CI — see `docs/PROJECT_STATUS.md`.
