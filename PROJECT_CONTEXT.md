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
- Git is initialized locally for this project.
- Current branch at the last check: `master`.
- Current remote at the last check: `origin -> https://github.com/Winnie2034/AtlasProj.git`.

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
- `backend/src/repositories/exerciseTemplateMetadata.repository.ts` - local cache access for Hevy exercise template muscle metadata.
- `backend/src/services/exerciseTemplateMetadata.service.ts` - fetches and stores missing Hevy template metadata without blocking sync/routines on failure.
- `backend/src/services/muscleGroups.ts` - shared Atlas muscle-group mapping, fallback title classification, and weighted set-count aggregation used by Dashboard and Workouts.
- `backend/src/services/workoutMetrics.ts` - shared backend top-lift and set-highlight helpers used by Dashboard selected-workout summaries and Workouts detail previews.
- `backend/src/services/sync.service.ts` - sync orchestration.
- `backend/src/services/dashboard.service.ts` - dashboard summary and analytics aggregation.
- `backend/src/services/workouts.service.ts` - workout list/detail serialization, filters, summary chips, and workout-detail muscle focus.
- `backend/src/services/routines.service.ts` - read-only Hevy routines loading/serialization.
- `backend/src/routes/routines.routes.ts` - `/api/routines` backend route.
- `frontend/src/pages/DashboardPage.tsx` - dashboard analytics UI.
- `frontend/src/pages/WorkoutListPage.tsx` - split-view Workouts explorer with search, date range, muscle filters, grouped workout history, CSS-native panel alignment, and Coach Card selected-workout preview.
- `frontend/src/components/workouts/ExerciseCard.tsx` - full workout detail exercise card with header metrics and compact set pills.
- `frontend/src/utils/workoutDisplay.ts` - shared frontend workout set labels, best-set selection, and exercise volume display used by Workouts preview rows and full exercise cards.
- `frontend/src/components/dashboard/CurrentWeekHeatmap.tsx` - compact current-week training heatmap shown beside the radar.
- `frontend/src/components/dashboard/TodayWorkoutCard.tsx` - bottom dashboard panel with a date picker, selected-date workout summary, and no-workout empty state.
- `frontend/src/components/dashboard/WeeklyMuscleRadarChart.tsx` - weekly radar chart for percentage muscle distribution.
- `frontend/src/components/dashboard/StatCard.tsx` - reusable dashboard stat card with Lucide icon support.
- `frontend/src/components/settings/SyncButton.tsx` - sync trigger and top-center result toast.
- `frontend/src/pages/RoutinesPage.tsx` - read-only routines UI.
- `frontend/src/components/routines/RoutineCard.tsx` - training-template routine card with inferred focus, composition metrics, movement preview, and expandable full detail.
- `frontend/src/pages/SettingsPage.tsx` - sync UI entry point.
- `frontend/src/utils/muscleFocus.ts` - shared frontend helper that converts live muscle set counts into display percentages.
- `hevy-api-architecture-overview.md` - local Hevy API reference summary used for endpoint/schema alignment.
- `.gitignore` - keeps local secrets, dependencies, build output, and Codex metadata out of Git.

## Recent Fixes / Gotchas

- Git safety cleanup:
  - Git was initialized in `C:\Users\walec\Documents\Codex\2026-07-05\und`.
  - Last known branch after `git init` was `master`.
  - Remote at the last check: `origin -> https://github.com/Winnie2034/AtlasProj.git`.
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
  - backend also calls `/v1/routine_folders?page=...&pageSize=...` so routines can display their Hevy folder name.
  - routines are not stored in local routine tables; `GET /api/routines` reads from Hevy through the backend and only seeds missing exercise template metadata.
  - the shared frontend Sync button invalidates the `["routines"]` query on success, so Dashboard and Settings sync actions refresh the Routines page through the same Hevy refresh flow.
  - routine folder lookup is optional; if Hevy rejects that endpoint or its response shape changes, routines still load without folder labels.
  - frontend route is `/routines`, linked from the sidebar.
  - routine cards are shown as a training-template board with inferred focus, exercise/set counts, set density, target style, rest targets, movement previews, and expandable full detail.
  - routine movement rows show planned sets, rest, reps, weight, distance, duration, and RPE where available.
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
- Hevy API requests now use a 30-second timeout and retry rate-limit or transient server failures before surfacing a clean Hevy API error.
- The frontend API client now converts network failures, non-JSON responses, and unreadable JSON into consistent `ApiError` instances instead of leaking raw parsing errors into the UI.
- The successful-sync cursor intentionally stores the sync start time, not the finish time, so the next incremental sync re-checks a safe overlap window and avoids missing mid-sync events.
- Workouts page was redesigned from a table into a split-view explorer:
  - left pane groups workout summaries by date and shows duration, sets, exercise count, and muscle chips.
  - right pane previews the selected workout with metrics, muscle focus, top lifts, exercise preview, and a Details link.
  - preview metrics and section headings use existing `lucide-react` icons for easier scanning.
  - selected workout preview is now a Coach Card with compact header metrics, vertical top-lift rows, vertically stacked muscle-focus percentage pills, and numbered exercise recap rows.
  - at wide desktop sizes, native CSS keeps Workout History aligned with the Coach Card without JavaScript height measurement.
  - bottom pagination controls were removed; the page currently requests the first page of the filtered workout list.
  - old table/search/pagination components were deleted after the split-view explorer replaced them.
  - `/api/workouts` summaries now include `durationMinutes` and `muscleGroups`.
  - `/api/workouts/:id` detail responses now include `muscleFocus`.
  - `/api/workouts/:id` detail responses now include `topLifts`, using the same backend top-lift helper as the dashboard selected-workout card.
  - `/api/workouts` supports `startDate`, `endDate`, and `muscleGroup` query filters in addition to search/sort/pagination.
  - muscle tags and filters use cached Hevy exercise template metadata when available, with title-pattern fallback only when metadata is missing.
  - summary chips use the dashboard-style weighted muscle model so primary muscles outrank secondary muscles.
  - workout detail `muscleFocus` uses the same dashboard-style weighted metadata model: primary muscles receive 70% of each set, secondary muscles split 30%, exercises without secondary muscles count 100% toward primary, and missing metadata falls back to title classification.
  - dashboard and Workouts preview muscle-focus percentages share `frontend/src/utils/muscleFocus.ts`; percentages are not stored in PostgreSQL.
  - Dashboard and Workouts backend muscle-focus logic share `backend/src/services/muscleGroups.ts`, so summary chips, selected-workout focus, workout-detail focus, and weekly radar all use the same weighted set-count calculation.
  - Workouts preview rows and full exercise cards share `frontend/src/utils/workoutDisplay.ts` for set labels, best-set selection, and exercise volume display.
  - full workout detail exercise cards use a header plus compact set pills instead of the older table-first layout.
  - latest Workouts verification included typecheck, build, an API detail smoke check confirming `muscleFocus`, and a 1920x1080 browser check that Workout History aligns with the Coach Card bottom.
- Dashboard was expanded from a basic workout summary into an analytics page:
  - top stat row shows total workouts, workouts this month, current streak, and last sync.
  - main chart shows weekly muscle distribution for the last 8 weeks.
  - a compact current-week heatmap sits beside the weekly muscle distribution radar.
  - bottom panel shows all workouts for the selected date with duration, set volume, muscle focus, top lifts, and a no-workout empty state.
  - stat cards, chart headers, selected workout metrics, and selected workout section headings use the existing Lucide icon set.
  - the weekly radar chart is the main dashboard chart in the top analytics row.
  - the radar chart uses the last 8 weeks from `muscleDistributionPerWeek`, lets the user switch weeks, and displays percentage distribution for Back, Chest, Shoulders, Arms, and Legs only.
  - Core and Other are intentionally skipped in the radar chart.
  - the radar now uses weighted training stimulus from cached Hevy exercise template metadata, not the old title-only classifier.
  - Hevy detailed muscles are mapped into Atlas groups: chest -> Chest; shoulders -> Shoulders; biceps/triceps/forearms -> Arms; lats/upper_back/lower_back/traps/neck -> Back; quadriceps/hamstrings/glutes/calves/adductors/abductors -> Legs; abdominals -> Core.
  - Weighted model: if an exercise has secondary muscles, its primary muscle group gets 70% of each set and secondary muscles split the remaining 30%; if there are no secondary muscles, the primary group gets 100%.
  - sync results appear as a temporary top-center toast instead of a card below the Sync button.
  - backend returns `workoutsThisMonth`, `currentStreakDays`, `muscleDistributionPerWeek`, `trainingDays`, `selectedDate`, and `selectedWorkouts` from `GET /api/dashboard`.
  - `GET /api/dashboard/selected-workout?date=YYYY-MM-DD` returns every workout for that date without refetching the whole dashboard; invalid calendar dates return validation errors.
  - `muscleDistributionPerWeek` and each `selectedWorkouts[].muscleFocus` use cached Hevy template metadata and fall back to the title classifier only when metadata is missing.
  - `TodayWorkoutCard` owns its selected date, selected-date fetch, and active workout index, so changing the date or workout updates only that card.
  - days with multiple workouts show title-and-time switcher buttons in chronological order; single-workout and rest-day layouts stay unchanged.
  - dashboard and Workouts preview muscle-focus percentages share `frontend/src/utils/muscleFocus.ts`; percentages are not stored in PostgreSQL.
  - Dashboard selected-workout top lifts and Workouts detail top lifts share `backend/src/services/workoutMetrics.ts`.
  - verified radar implementation with `npm.cmd run typecheck`, `npm.cmd run build`, and a local browser check against `http://localhost:5173/`.
  - Verified with `npm.cmd run typecheck`, `npm.cmd run build`, and a local browser/API smoke check against `http://localhost:5173/` and `http://localhost:4000/api/dashboard`.
- Exercise template metadata cache:
  - Added Prisma model/table `exercise_template_metadata` via migration `20260708000100_add_exercise_template_metadata`.
  - The table stores `hevyExerciseTemplateId`, `title`, `type`, `primaryMuscleGroup`, `secondaryMuscleGroups`, `equipment`, `isCustom`, and fetch timestamps.
  - `HevyClient` now supports `GET /v1/exercise_templates/{exerciseTemplateId}`.
  - `ExerciseTemplateMetadataService.ensureMetadataForTemplateIds(ids)` fetches only missing template IDs and logs warning-level failures instead of breaking sync/routine loading.
  - Workout sync calls the metadata service after normalizing a fetched workout and before saving it.
  - Routine listing calls the metadata service after fetching routines, so routine exercise templates can also seed the same cache.
  - Dashboard reads cached metadata locally; it does not call Hevy.
  - Fallback remains the old title-based classifier if metadata is missing.
  - Local verification populated 37 distinct exercise template metadata rows from existing synced workouts, then a second ensure pass fetched 0 rows, confirming no redundant Hevy calls.
  - API smoke check confirmed `GET /api/dashboard` includes weighted `muscleDistributionPerWeek`.
  - Browser check confirmed the radar displays "Weighted training stimulus" and week switching still works.
  - Final sanity check before commit:
    - `npm.cmd run typecheck` passed.
    - `npm.cmd run build` passed.
    - Browser smoke check passed for Workouts: split view renders, muscle filter works, no bottom pagination text, and no stale `page` query param.
    - Browser smoke check passed for Dashboard: the date picker renders, selected workout muscle focus displays percentages, and no `NaN`/`undefined` text leaked.
    - Browser console error check returned no errors.
    - `npm.cmd --workspace backend exec prisma migrate status` reported the database schema is up to date.
    - Direct `SyncService.runSync()` against Hevy completed successfully with no errors. At that time Hevy returned no new workout events for the current cursor, so counts remained 20 workouts, 119 exercises, 411 sets, and 37 cached template metadata rows.
    - Metadata ensure check over 37 distinct local exercise template IDs fetched 0 new rows and failed 0 rows, confirming cache reuse.
    - Direct dashboard service check returned 8 raw weeks, 8 weighted weeks, and 35 training days.
    - Direct routines service check from the backend folder returned 6 routines.
    - `npm.cmd --workspace backend run prisma:generate` hit a Windows `EPERM` rename lock on `node_modules/.prisma/client/query_engine-windows.dll.node`; this appears to be a local file-lock issue because the generated client already includes the new model and typecheck/build/runtime checks pass.

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

Current remote:

```text
origin -> https://github.com/Winnie2034/AtlasProj.git
```

To push the current `master` branch after committing:

```powershell
git push origin master
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
backend/src/services/dashboard.service.ts
backend/src/services/exerciseTemplateMetadata.service.ts
backend/src/repositories/exerciseTemplateMetadata.repository.ts
frontend/src/components/dashboard/WeeklyMuscleRadarChart.tsx
frontend/src/components/dashboard/CurrentWeekHeatmap.tsx
frontend/src/components/dashboard/TodayWorkoutCard.tsx
frontend/src/pages/WorkoutListPage.tsx
frontend/src/utils/muscleFocus.ts
```

Then inspect the current task-specific files before editing.
