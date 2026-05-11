# Gemini Usage Tracker

> SAS Technology & Innovation

Tracks and visualises Google Gemini AI usage across Singapore American School. The system has two parts: a Google Apps Script project that processes data in a Google Spreadsheet, and a self-hosted SvelteKit dashboard that displays analytics.

## Overview

```text
Google Spreadsheet  ──►  Apps Script (sync + JSON API)  ──►  SvelteKit Dashboard
    (source data)              (no database)                   (Docker, port 3000)
```

- Staff and student data is exported into the spreadsheet by admins
- Apps Script syncs and merges data across 7 sheet tabs on demand
- The dashboard fetches data from the Apps Script JSON API on each request (5-minute cache)
- **No database** — Google Sheets is the single source of truth; the Docker image is stateless
- If the dashboard is unavailable, a built-in fallback dashboard is served directly from Apps Script

## Quick install

Once the Apps Script is deployed (Part 1 below), run this on any machine with Docker:

```bash
git clone https://github.com/sas-technology/gemini-users.git
bash gemini-users/install.sh
```

The script prompts for your credentials, writes `.env`, pulls the pre-built image from `ghcr.io`, and starts the container.

## Prerequisites

- **Docker** (for production deployment)
- **Google Workspace admin access** to the SAS domain
- **Google Apps Script CLI** (`clasp`) for deploying script changes
- **Node.js 24+** and npm (only for local development)

---

## Part 1 — Apps Script setup

### 1. Install clasp

```bash
npm install -g @google/clasp
clasp login
```

### 2. Link to the spreadsheet

Open `.clasp.json` and ensure `scriptId` points to the Apps Script project bound to the Gemini Usage Tracker spreadsheet. If starting fresh:

```bash
clasp create --type sheets --title "Gemini Usage Tracker"
```

### 3. Push the script files

```bash
clasp push
```

This deploys the contents of `apps-script/` (`Code.js`, `WebApp.js`, `Progress.html`, `Fallback.html`, and `appsscript.json`) to Google Apps Script.

### 4. Set the API key

In the Apps Script editor:

1. Go to **Project Settings** (gear icon)
2. Open **Script Properties**
3. Add a property: `API_KEY` = a long random secret (e.g. output of `openssl rand -hex 32`)

Keep this value — you'll need it in Step 2 of the quick install.

### 5. Deploy as a Web App

In the Apps Script editor:

1. Click **Deploy → New deployment**
2. Select type: **Web App**
3. Set **Execute as**: Me
4. Set **Who has access**: Anyone with Google Account
5. Click **Deploy** and copy the Web App URL

Keep this URL — you'll need it in Step 2 of the quick install.

### 6. Set up the spreadsheet menu

Open the bound spreadsheet. A **Gemini Tracker** menu should appear in the toolbar. Use **🔄 Run Full Sync** to run the initial data sync.

---

## Part 2 — Dashboard

### Quick install (recommended)

```bash
git clone https://github.com/sas-technology/gemini-users.git
bash gemini-users/install.sh
```

The script prompts for your credentials, pulls the pre-built image from `ghcr.io`, and starts the container.

### Manual install

```bash
git clone https://github.com/sas-technology/gemini-users.git
cd gemini-users/sveltekit-app
cp .env.example .env   # then edit .env with your values
docker compose up -d
```

### Environment variables

| Variable              | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `DASHBOARD_SECRET`    | Password users log in with                                   |
| `APPS_SCRIPT_URL`     | Web App URL from Step 5 above                                |
| `APPS_SCRIPT_API_KEY` | API key from Step 4 above                                    |
| `ORIGIN`              | Public URL of this server (e.g. `https://gemini.sas.edu.sg`) |

### Verify it's running

```bash
curl http://localhost:3000/api/health
# → {"status":"ok"}
```

### Local development

```bash
cd sveltekit-app
npm install && cp .env.example .env
npm run dev    # http://localhost:5173
```

---

## Using the dashboard

Navigate to **`http://localhost:3000`** and log in with the `DASHBOARD_SECRET` password you set.

| Page         | URL               | Description                                |
| ------------ | ----------------- | ------------------------------------------ |
| Overview     | `/`               | Usage stats, charts, filterable user table |
| Divisions    | `/divisions`      | Per-division breakdown and comparison      |
| User profile | `/user?email=...` | Individual usage detail                    |

Sessions expire after 8 hours.

---

## Running the Apps Script sync manually

Open the bound Google Spreadsheet and use the **Gemini Tracker → 🔄 Run Full Sync** menu item. A progress dialog shows live logs as each step completes:

1. Detect duplicate emails
2. Sync pro user list from staff list
3. Merge usage data into all sheets
4. Update untracked users sheet
5. Apply usage colour coding

---

## Development

### Install root tooling (formatting, commit hooks)

```bash
# from repo root
npm install
```

### Common commands

```bash
# Root
npm run format          # Format all files with Prettier
npm run format:check    # Check formatting (run by CI)
npm run markdownlint    # Lint all markdown files

# sveltekit-app (run from sveltekit-app/)
npm run dev             # Dev server (http://localhost:5173)
npm run typecheck       # TypeScript + Svelte type check
npm run lint            # ESLint
npm run test:run        # Run unit tests once
npm run build           # Production build
```

Pre-commit hooks (Husky + lint-staged) automatically format staged files on every `git commit`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch conventions and PR process.

---

## Repository structure

```text
/
├── apps-script/           # Google Apps Script source (pushed via clasp)
│   ├── Code.js            # Sheet sync, deduplication, auto-triggers
│   ├── WebApp.js          # JSON API + fallback HTML dashboard
│   ├── Progress.html      # Modal shown while sync scripts run
│   ├── Fallback.html      # Emergency read-only dashboard
│   └── appsscript.json    # Apps Script runtime config (V8, SGT)
├── install.sh             # One-command setup script
├── sveltekit-app/         # SvelteKit dashboard
│   ├── src/
│   │   ├── lib/           # Types, cache, auth, sheets API client
│   │   ├── routes/        # File-based routes + API endpoints
│   │   └── hooks.server.ts # Auth middleware
│   ├── Dockerfile         # Multi-stage Node 24 Alpine build
│   ├── docker-compose.yml
│   └── .env.example
├── .github/
│   ├── workflows/ci.yml      # 5-level CI pipeline
│   ├── workflows/publish.yml # Publishes image to ghcr.io on merge to main
│   ├── dependabot.yml        # Automated dependency updates
│   └── ISSUE_TEMPLATE/
├── CONTRIBUTING.md
└── SECURITY.md
```

---

## CI pipeline

GitHub Actions runs on every push and pull request to `main`. Jobs run in dependency order — nothing downstream runs if something upstream fails.

| Level | Jobs                                    | Gate                   |
| ----- | --------------------------------------- | ---------------------- |
| 1     | `format-root`, `format-sveltekit`       | Prettier + `npm audit` |
| 2     | `typecheck-sveltekit`, `lint-sveltekit` | Needs Level 1          |
| 3     | `test-sveltekit`                        | Needs typecheck        |
| 4     | `build-sveltekit`                       | Needs lint + test      |
| 5     | `docker-sveltekit`                      | Needs build            |

On merge to `main`, `publish.yml` builds and pushes the Docker image to `ghcr.io`.

---

## Technology

| Layer            | Stack                                             |
| ---------------- | ------------------------------------------------- |
| Sheet processing | Google Apps Script (V8 runtime)                   |
| Data API         | Apps Script `doGet` with API key auth             |
| Dashboard        | SvelteKit 2 + Svelte 5                            |
| Charts           | Chart.js 4                                        |
| Auth             | Cookie-based (`DASHBOARD_SECRET`, 8 h session)    |
| Deployment       | Docker — Node 24 Alpine, `@sveltejs/adapter-node` |
| Tests            | Vitest 4                                          |
| Linting          | ESLint 10 (flat config), Prettier 3               |
