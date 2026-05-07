# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Workspace Apps Script project that manages and tracks Gemini AI usage across Singapore American School (SAS). It syncs staff/student data across multiple Google Sheets tabs and exposes a JSON API consumed by a self-hosted SvelteKit dashboard.

## Repository Structure

```text
/                         # Root — Apps Script source + dev tooling
├── Code.js               # Sheet processing, sync logic, menu
├── WebApp.js             # JSON API + fallback HTML dashboard
├── Progress.html         # Modal shown while sync scripts run
├── Fallback.html         # Emergency read-only dashboard (if SvelteKit is down)
├── appsscript.json       # Apps Script runtime config
├── install.sh            # One-command setup script
└── sveltekit-app/        # Self-hosted analytics dashboard (SvelteKit 2 + Svelte 5)
```

## Apps Script Development

Managed with [clasp](https://github.com/nicholaschiang/clasp):

```bash
clasp push          # Push local changes to Google Apps Script
clasp pull          # Pull remote changes
clasp open          # Open the script in browser
clasp open --addon  # Open the bound spreadsheet
```

The Apps Script runtime is V8, Asia/Singapore timezone, Stackdriver logging. No build step — code runs directly.

## Apps Script Architecture

### Files

- **Code.js** — All sheet logic: menu creation, auto-sync triggers, data synchronisation, and the `runFullSync()` function called by `Progress.html`
- **WebApp.js** — Dual-mode `doGet` handler:
  - JSON API mode (`?format=json&key=KEY&endpoint=...`) — consumed by the SvelteKit app
  - Fallback HTML dashboard — rendered when SvelteKit is unavailable
- **Progress.html** — SAS-branded modal dialog; calls `runFullSync()` via `google.script.run` and displays a live log
- **Fallback.html** — Read-only emergency dashboard with stats grid, division cards, and filterable user table

### Data Flow

The system operates on a single Google Spreadsheet with 7 sheet tabs. Data flows in one direction:

1. **Source sheets** (`staff_list`, `usage_counts`, `usage_by_priority`) are populated externally (admin exports)
2. **`syncUserListFromCheatsheet()`** copies staff data → `pro_user_list`
3. **`syncUsageDataToAllSheets()`** merges usage data into all target sheets by email-based lookup
4. **`updateUntrackedUsersSheet()`** identifies emails in usage data not found in any known list
5. **SvelteKit app** calls `/api/usage`, `/api/students`, `/api/divisions` → SvelteKit server routes → `WebApp.js` JSON API → sheet data

### Key Patterns

- **Column definitions are constants** at the top of Code.js (`STAFF_LIST_COLS`, `PRO_USER_LIST_COLS`, etc.). Every sheet tab has its own column map. Always use these constants — never hardcode column letters.
- **Row 1 = headers, Row 2 = first data row** throughout all sheets.
- **Email is the join key** across all sheets. `buildUsageLookupMaps()` creates `{email → row_data}` maps from usage sheets.
- **Batch read/write** — all sheet operations use `getRange().getValues()` / `setValues()` for performance. Avoid cell-by-cell reads.
- **Auto-sync on edit** — `onEdit(e)` triggers sync when specific sheets are modified.
- **Toast messages** for user-facing status; `Logger` for debug output.
- **API key auth** — `WebApp.js` reads `API_KEY` from Script Properties; the same value goes in the SvelteKit `.env` as `APPS_SCRIPT_API_KEY`.

### Sheet Tab Schema

| Sheet                      | Purpose                                      | Key columns                                            |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| `staff_list`               | Full staff directory (external source)       | EMAIL, PRIMARY_SCHOOL, JOB_TITLE, ROLES                |
| `pro_user_list`            | Gemini Pro licence holders                   | EMAIL, DIVISION, USAGE, ACTIVE_DAYS                    |
| `usage_counts`             | Numerical usage metrics                      | EMAIL + per-service counts (Gmail, Docs, Sheets, etc.) |
| `usage_by_priority`        | Priority labels (High/Medium/Low/Zero)       | Same structure as usage_counts                         |
| `student_gemini_access`    | Students with Gemini                         | EMAIL, CURRENT_GRADE, ENROLLMENT_STATUS                |
| `student_no_gemini_access` | Students without Gemini                      | Same structure                                         |
| `untracked_users`          | Auto-generated: unknown emails in usage data | EMAIL, USAGE_PRIORITY, OVERALL_USAGE                   |

## SvelteKit App (`sveltekit-app/`)

SvelteKit 2 + Svelte 5 dashboard. Deployed as a Docker container via `@sveltejs/adapter-node`.

- **No database** — all data fetched from the Apps Script JSON API on each request with a 5-minute in-memory cache
- Data loads server-side (`+page.server.ts`) — no client-side loading spinners
- Auth via `hooks.server.ts` — cookie session validated on every request

### SAS Brand Reference

- **Colours**: Red `#a0192a`, Blue `#1a2d58`, Yellow `#fabc00`
- **Division colours**: ES `#228ec2`, MS `#a0192a`, HS `#1a2d58`, Admin `#6d6f72`
- **Usage priority colours**: High `#ff0000`, Medium `#ff9900`, Low `#ffcc00`, Zero `#28a745`

## Dev Tooling

| Tool           | Config                           | Run                                     |
| -------------- | -------------------------------- | --------------------------------------- |
| Prettier       | `.prettierrc`                    | `npm run format`                        |
| markdownlint   | `.markdownlint.json`             | `npm run markdownlint`                  |
| Husky          | `.husky/pre-commit`              | Auto on `git commit`                    |
| ESLint         | `sveltekit-app/eslint.config.js` | `cd sveltekit-app && npm run lint`      |
| TypeScript     | `sveltekit-app/tsconfig.json`    | `cd sveltekit-app && npm run typecheck` |
| Vitest         | `sveltekit-app/vitest.config.ts` | `cd sveltekit-app && npm run test:run`  |
| GitHub Actions | `.github/workflows/ci.yml`       | Auto on push/PR                         |
