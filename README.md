# SAS Gemini Usage Tracker

Tracks and visualises Google Gemini AI usage across Singapore American School (SAS). Built on Google Apps Script for sheet processing and a self-hosted Next.js dashboard for analytics.

## What it does

- Syncs staff and student data across a Google Spreadsheet with 7 tabs
- Exposes usage data as a JSON API via Google Apps Script
- Provides an interactive analytics dashboard (Overview, Divisions, User Profile)
- Shows a fallback read-only dashboard if the Next.js app is unavailable
- Runs a progress dialog with live logs when sync scripts execute

## Repository structure

```
/
├── Code.js               # Sheet sync, deduplication, auto-triggers
├── WebApp.js             # JSON API + fallback HTML dashboard
├── Progress.html         # Modal shown while sync scripts run
├── Fallback.html         # Emergency read-only dashboard
├── appsscript.json       # Apps Script runtime config (V8, SGT)
├── nextjs-app/           # Self-hosted analytics dashboard
│   ├── src/
│   │   ├── app/          # Next.js App Router pages and API routes
│   │   ├── components/   # React client components (charts, tables)
│   │   ├── lib/          # Data fetching, auth, cache utilities
│   │   └── types/        # Shared TypeScript interfaces
│   ├── Dockerfile        # Multi-stage Node 24 Alpine build
│   └── docker-compose.yml
├── .github/workflows/
│   └── ci.yml            # 5-level CI pipeline
└── .husky/pre-commit     # Runs Prettier via lint-staged
```

## Apps Script setup

Managed with [clasp](https://github.com/nicholaschiang/clasp).

```bash
npm install -g @google/clasp
clasp login
clasp push          # Deploy local changes to Google Apps Script
clasp pull          # Fetch remote changes
clasp open          # Open script editor
clasp open --addon  # Open the bound spreadsheet
```

**API key** — set a secret value in Apps Script editor under **Project Settings → Script Properties → `API_KEY`**. Use the same value in the Next.js `.env` as `APPS_SCRIPT_API_KEY`.

**Web app deployment** — In Apps Script editor: **Deploy → New deployment → Web App → Execute as "Me" → Access "Anyone with Google Account"**. Copy the URL into the Next.js `.env` as `APPS_SCRIPT_URL`.

## Next.js dashboard

See [nextjs-app/README.md](nextjs-app/README.md) for local dev, environment variables, and Docker deployment.

## Dev tooling

Dependencies are split between the repo root (Prettier, markdownlint, Husky) and `nextjs-app/` (ESLint, Vitest, TypeScript).

```bash
# Root — install formatting and commit-hook tools
npm install

# Format all files
npm run format

# Check formatting (what CI runs)
npm run format:check

# Lint markdown
npm run markdownlint
```

Pre-commit hooks run automatically via Husky and lint-staged — staged files are auto-formatted before every commit.

## CI pipeline

GitHub Actions runs on every push and pull request against `main`:

| Level | Job                            | Depends on      |
| ----- | ------------------------------ | --------------- |
| 1     | `format-root`, `format-nextjs` | —               |
| 2     | `typecheck`, `lint`            | Level 1         |
| 3     | `test`                         | `typecheck`     |
| 4     | `build`                        | `lint` + `test` |
| 5     | `docker`                       | `build`         |

`npm audit --audit-level=moderate` runs at Level 1, so vulnerabilities block the pipeline before any compilation or tests start.

## Technology

| Layer            | Stack                                                  |
| ---------------- | ------------------------------------------------------ |
| Sheet processing | Google Apps Script (V8 runtime)                        |
| Data API         | Apps Script `doGet` with API key auth                  |
| Dashboard        | Next.js 15, React 19, TypeScript, Tailwind CSS         |
| Charts           | Chart.js 4 via react-chartjs-2                         |
| Auth             | Cookie-based (`DASHBOARD_SECRET` env var, 8 h session) |
| Deployment       | Docker (Node 24 Alpine, standalone Next.js output)     |
| Tests            | Vitest 4                                               |
| Linting          | ESLint 9 (flat config), Prettier 3                     |
