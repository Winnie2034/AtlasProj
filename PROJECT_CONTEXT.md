# Atlas Project Context

## Purpose

Atlas is a personal local workout data app for one user. It syncs workouts from the Hevy API into local PostgreSQL, exposes the data through an Express API, and displays it in a React frontend.

## Current Scope

- Single-user local app only.
- No authentication.
- No Docker.
- No dynamic Hevy API key entry in the frontend.
- Hevy API key is configured on the backend through `backend/.env`.
- Frontend never calls Hevy directly.
- Git is initialized locally for this project, but no remote was configured at the last check.

## Run Command

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:4000/api
```

Stop the app with `Ctrl+C` in the terminal running the servers.

## Local Database

The app uses the local PostgreSQL installation directly. Real credentials live only in `backend/.env`, which must not be committed.

```text
Host: localhost
Port: 5432
Database: postgres or the local database named in backend/.env
Username: configured in backend/.env
Password: configured in backend/.env
```

The Prisma connection string is configured as:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

## Hevy API

The personal Hevy API key is stored in:

```text
backend/.env
```

Do not build a frontend API-key input unless the user explicitly changes direction.

## Important Files

- `start.ps1` - one-command app startup.
- `scripts/dev-local.ps1` - local setup and run script.
- `backend/.env` - local secrets/config.
- `backend/.env.example` - safe placeholder environment template; do not put real secrets here.
- `backend/prisma/schema.prisma` - database schema.
- `backend/src/services/hevy/hevy.client.ts` - Hevy HTTP client.
- `backend/src/services/hevy/hevy.types.ts` - Hevy response validation schemas.
- `backend/src/services/sync.service.ts` - sync orchestration.
- `backend/src/services/routines.service.ts` - read-only Hevy routines loading/serialization.
- `backend/src/routes/routines.routes.ts` - `/api/routines` backend route.
- `frontend/src/pages/RoutinesPage.tsx` - read-only routines UI.
- `frontend/src/components/routines/RoutineCard.tsx` - routine detail card UI.
- `frontend/src/pages/SettingsPage.tsx` - sync UI entry point.
- `hevy-api-architecture-overview.md` - local Hevy API reference summary used for endpoint/schema alignment.
- `.gitignore` - keeps local secrets, dependencies, build output, and Codex metadata out of Git.

## Recent Fixes / Gotchas

- Git safety cleanup:
  - Git was initialized in `C:\Users\walec\Documents\Codex\2026-07-05\und`.
  - Last known branch after `git init` was `master`.
  - No Git remote was configured at the last check.
  - `backend/.env` is ignored and should contain the real local `DATABASE_URL` and `HEVY_API_KEY`.
  - `backend/.env.example` contains placeholders only and is safe to commit.
  - `README.md` and this context file no longer contain the real PostgreSQL password or Hevy API key.
  - `scripts/dev-local.ps1` now reads database connection details from `backend/.env` instead of hardcoding the local password.
  - `git check-ignore -v backend/.env` was verified and matched `.gitignore`.
  - A scan of Git-visible text files found no matches for the real Hevy API key or old DB password patterns.
  - Git is installed at `C:\Program Files\Git\cmd\git.exe`; if plain `git` is not visible inside Codex, call that full path or restart the terminal/app so PATH refreshes.
  - Do not run `git add -f backend/.env`.
  - If secrets were ever committed or pushed before this cleanup, rotate the Hevy API key and local DB password, then clean Git history if the remote was public/shared.
- Added a read-only Routines section:
  - backend exposes `GET /api/routines`.
  - backend currently calls Hevy at `/v1/routines?page=...&pageSize=...`.
  - frontend route is `/routines`, linked from the sidebar.
  - routine cards show exercises, planned sets, rest, reps, weight, distance, duration, and RPE where available.
  - routine response validation is intentionally tolerant: accepts `{ routines: [...] }`, `{ data: [...] }`, or a raw array.
  - routine pagination now preserves and uses Hevy's `page_count` when available, falling back to page-size length checks otherwise.
  - routine set validation accepts both `type` and API-style `set_type`, normalizing to internal `type`.
  - `RoutineCard` had a mojibake separator in planned set text; it was replaced with a plain ASCII separator.
  - Official Hevy Swagger docs are interactive and were not fully inspectable from the sandbox, so if routines do not load, first verify the exact Hevy routines endpoint and adjust `backend/src/services/hevy/hevy.client.ts`.
  - Verified after implementation and after schema alignment with `npm.cmd run typecheck` and `npm.cmd run build`.
  - A targeted schema smoke check also passed for `{ page, page_count, routines: [...] }` with routine sets using `set_type`.
- Startup now uses `npm`, not `pnpm`, because Corepack tried to write pnpm shims into `C:\Program Files\nodejs` and failed without admin permissions.
- In PowerShell, run npm through `npm.cmd` when direct `npm` is blocked by execution policy.
- The app uses the database and user specified by `DATABASE_URL` in `backend/.env`.
- PostgreSQL service startup may require admin rights. If the script cannot start the service, start `postgresql-x64-18` from Windows Services and rerun `start.ps1`.
- Hevy schema validation was made more tolerant:
  - workout count accepts `count`, `workout_count`, or a raw number.
  - single workout accepts direct workout object or `{ workout: ... }`.
  - workout/routine set type accepts `set_type` and normalizes it to `type`.
  - missing/null `exercise_template_id` is converted to `"unknown"`.
  - schema errors now include the failing field path.

## Git Workflow

Before committing:

```powershell
git status
git check-ignore -v backend/.env
```

If `backend/.env` is ignored, commit normally:

```powershell
git add .
git commit -m "Initial Atlas project commit"
```

To connect a remote:

```powershell
git remote add origin YOUR_REPO_URL
git push -u origin master
```

If the branch is renamed to `main`, push `main` instead.

## Suggested Future Instructions

When resuming this project, first read:

```text
PROJECT_CONTEXT.md
README.md
hevy-api-architecture-overview.md
backend/.env.example
scripts/dev-local.ps1
backend/src/services/hevy/hevy.types.ts
backend/src/services/sync.service.ts
backend/src/services/routines.service.ts
```

Then inspect the current task-specific files before editing.
