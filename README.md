# Atlas

Atlas is a single-user workout data platform that syncs Hevy workout data into PostgreSQL, exposes it through an Express API, and renders it in a React dashboard.

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

To connect a remote later:

```powershell
git remote add origin YOUR_REPO_URL
git push -u origin master
```

If you rename the branch to `main`, push `main` instead:

```powershell
git branch -m main
git push -u origin main
```

## Notes

The Hevy integration is isolated behind `HevyClient` and validates responses with Zod. Before using real sync data, verify the live Swagger schema at `https://api.hevyapp.com/docs/` with your API access because Hevy may change response fields.
