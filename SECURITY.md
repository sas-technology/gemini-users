# Security Policy

## Scope

This dashboard handles SAS staff and student data sourced from Google Workspace. Please treat all data displayed in the dashboard as confidential.

## Supported versions

Only the latest code on `main` is actively maintained.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues directly to the SAS Technology team:

- **Email**: `it@singaporeamericanschool.org`
- **Subject line**: `[SECURITY] gemini-users — <brief description>`

Include:

1. A description of the vulnerability and its potential impact
2. Steps to reproduce
3. Any suggested remediation if known

You can expect an acknowledgement within 2 business days. We will keep you informed as we investigate and work toward a fix.

## Security design notes

- The Next.js dashboard is protected by a password stored in `DASHBOARD_SECRET` (never committed to the repo)
- The Apps Script JSON API is protected by an `API_KEY` stored in Script Properties (never committed to the repo)
- Authentication cookies are `httpOnly`, `SameSite=lax`, and expire after 8 hours
- No user credentials are stored — authentication is a shared secret, not per-user
- All data originates from Google Workspace admin exports; no user data is written back
- The Docker image runs as a non-root user (`nextjs`)

## Dependencies

Dependency vulnerabilities are monitored by Dependabot and `npm audit` (run in CI at `--audit-level=moderate`). Moderate and above block the pipeline.
