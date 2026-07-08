# Atlas

Atlas is a single-user workout data platform that syncs Hevy workout data into PostgreSQL, exposes it through an Express API, and renders it in a React dashboard.

## Current Features

- Sync Hevy workout history into local PostgreSQL.
- Browse synced workouts in a split-view explorer with search, date range, muscle filters, and workout preview.
- Browse read-only Hevy routines.
- View dashboard analytics:
  - total workouts
  - workouts this month
  - current training streak
  - last sync status
  - weekly muscle distribution radar
  - current-week training heatmap
  - date-filtered workout summary with empty state for days without synced workouts
- Trigger sync from the UI. Sync results show as a temporary top-center toast instead of shifting the page layout.

## Structure

- `backend/` - Node.js, Express, TypeScript, Prisma
- `frontend/` - React, TypeScript, Vite, Tailwind CSS, TanStack Query

## Local Setup

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

This uses your local PostgreSQL installation, installs dependencies, runs Prisma setup, and launches the backend and frontend. If `backend/.env` does not exist, the script creates it from `backend/.env.example`; add your real `HEVY_API_KEY` before running a sync.

No Docker is required.

If you prefer npm scripts, `npm run start:local` runs the same script.

The backend serves `http://localhost:4000/api`, and the frontend serves `http://localhost:5173`.

## PostgreSQL Credentials

Configure local PostgreSQL in `backend/.env` through `DATABASE_URL`.

Example format:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/postgres
```

Do not commit `backend/.env`; it is intentionally ignored by Git.

## Git and Secrets

This project is safe to track in Git as long as local secrets stay out of commits.

Tracked:

- Source code
- `README.md`
- `PROJECT_CONTEXT.md`
- `backend/.env.example`
- Prisma schema and migrations
- Startup scripts

Ignored:

- `backend/.env`
- `node_modules/`
- `backend/dist/`
- `frontend/dist/`
- local Codex metadata folders
- local output/work folders

Before committing, verify the real environment file is ignored:

```powershell
git check-ignore -v backend/.env
```

If this prints a `.gitignore` rule, it is safe. Do not force-add `backend/.env`.

Common first commit flow:

```powershell
git status
git add .
git commit -m "Initial Atlas project commit"
```

The current repo uses `master` and is connected to:

```text
origin -> https://github.com/Winnie2034/AtlasProj.git
```

Normal update flow:

```powershell
git status
git add .
git commit -m "Describe your change"
git push origin master
```

If you rename the branch to `main`, push `main` instead:

```powershell
git branch -m main
git push -u origin main
```

## Notes

The Hevy integration is isolated behind `HevyClient` and validates responses with Zod. Before using real sync data, verify the live Swagger schema at `https://api.hevyapp.com/docs/` with your API access because Hevy may change response fields.

Dashboard muscle-group analytics use cached Hevy exercise template metadata for the weekly radar chart and selected-date workout summary. The radar shows weighted training stimulus across Back, Chest, Shoulders, Arms, and Legs for the selected week, skipping Core and Other.

Atlas stores Hevy template metadata locally in `exercise_template_metadata`, so the dashboard does not call Hevy while rendering. During workout sync and routine loading, Atlas fetches only missing exercise template metadata and reuses cached rows afterward. The radar and today's workout muscle-focus model give the primary muscle group 70% of each set and split the remaining 30% across secondary muscles; exercises without secondary muscles count 100% toward their primary group.

Workout muscle focus percentages are calculated in the frontend at render time with a shared helper, not stored in the database. The Workouts page currently shows the first page of the filtered workout list in its split-view explorer and intentionally does not render bottom pagination controls.

A future improvement could add a Settings page for manual overrides, but the current implementation already uses Hevy's `primary_muscle_group` and `secondary_muscle_groups` fields when available.

Recent sanity checks verified typecheck, build, browser smoke checks for Workouts and Dashboard, migration status, direct Hevy sync, dashboard analytics, routines loading, and metadata cache reuse. If `prisma generate` reports a Windows `EPERM` rename error for the Prisma query engine DLL, close running Node/API processes and retry; the generated client may simply be locked by a local process.
