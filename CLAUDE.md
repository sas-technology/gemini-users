# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Workspace Apps Script project that manages and tracks Gemini AI usage across Singapore American School (SAS). It syncs staff/student data across multiple Google Sheets tabs and provides an interactive analytics dashboard.

## Development Setup

This is a Google Apps Script project managed with [clasp](https://github.com/nicholaschiang/clasp):

```bash
# Push local changes to Google Apps Script
clasp push

# Pull remote changes
clasp pull

# Open the script in browser
clasp open

# Open the bound spreadsheet
clasp open --addon
```

There are no build steps, tests, or linters — code runs directly in the Apps Script V8 runtime.

## Architecture

### Files

- **Code.js** — All backend logic: menu creation, auto-sync triggers, data synchronization, usage lookups, and dashboard data APIs
- **Dashboard.html** — Self-contained SPA served as a modal dialog via `HtmlService`. Uses Chart.js 4.4.0 (CDN) for visualizations
- **appsscript.json** — Runtime config (V8, Asia/Singapore timezone, Stackdriver logging)
- **.clasp.json** — clasp deployment metadata

### Data Flow

The system operates on a single Google Spreadsheet with 7 sheet tabs. Data flows in one direction:

1. **Source sheets** (`staff_list`, `usage_counts`, `usage_by_priority`) are populated externally (admin exports)
2. **`syncUserListFromCheatsheet()`** copies staff data → `pro_user_list`
3. **`syncUsageDataToAllSheets()`** merges usage data into all target sheets by email-based lookup
4. **`updateUntrackedUsersSheet()`** identifies emails in usage data not found in any known list
5. **Dashboard** reads aggregated data via `google.script.run` calls to `getUsageData()`, `getStudentData()`, `getStaffEmails()`

### Key Patterns

- **Column definitions are constants** at the top of Code.js (`STAFF_LIST_COLS`, `PRO_USER_LIST_COLS`, etc.). Every sheet tab has its own column map. Always use these constants — never hardcode column letters.
- **Row 1 = headers, Row 2 = first data row** throughout all sheets.
- **Email is the join key** across all sheets. `buildUsageLookupMaps()` creates `{email → row_data}` maps from usage sheets.
- **Batch read/write** — all sheet operations use `getRange().getValues()` / `setValues()` for performance. Avoid cell-by-cell reads.
- **Auto-sync on edit** — `onEdit(e)` triggers sync when specific sheets are modified.
- **Toast messages** for user-facing status; `Logger` for debug output.

### Dashboard (Dashboard.html)

Self-contained HTML/CSS/JS with SAS branding:
- Brand colors: SAS Red `#a0192a`, Blue `#1a2d58`, Yellow `#fabc00`
- Division-specific colors for Elementary, Middle, High School, Admin
- Usage level colors: High (red), Medium (orange), Low (yellow), Zero (green)
- Quick filters (All Users, AI Pro, Basic Only, Non-Active, Students) and advanced filters
- All data fetched via `google.script.run` — no external API calls

### Sheet Tab Schema

| Sheet | Purpose | Key columns |
|-------|---------|-------------|
| `staff_list` | Full staff directory (external source) | EMAIL, PRIMARY_SCHOOL, JOB_TITLE, ROLES |
| `pro_user_list` | Gemini Pro license holders | EMAIL, DIVISION, USAGE, ACTIVE_DAYS |
| `usage_counts` | Numerical usage metrics | EMAIL + per-service counts (Gmail, Docs, Sheets, etc.) |
| `usage_by_priority` | Priority labels (High/Medium/Low/Zero) | Same structure as usage_counts |
| `student_gemini_access` | Students with Gemini | EMAIL, CURRENT_GRADE, ENROLLMENT_STATUS |
| `student_no_gemini_access` | Students without Gemini | Same structure |
| `untracked_users` | Auto-generated: unknown emails in usage data | EMAIL, USAGE_PRIORITY, OVERALL_USAGE |
