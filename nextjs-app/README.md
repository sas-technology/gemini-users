# SAS Gemini Dashboard

Self-hosted analytics dashboard for tracking Google Gemini AI usage across Singapore American School. Built with Next.js 15 and deployed via Docker.

## Prerequisites

- Node.js 24+
- Docker (for production deployment)
- A deployed Google Apps Script web app (see root [README](../README.md) for setup)

## Environment variables

Copy `.env.example` to `.env` and fill in all three values:

```bash
cp .env.example .env
```

| Variable              | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| `DASHBOARD_SECRET`    | Password used to log in to the dashboard                                         |
| `APPS_SCRIPT_URL`     | Deployed web app URL from Apps Script (Deploy → Manage Deployments)              |
| `APPS_SCRIPT_API_KEY` | Secret key set in Apps Script → Project Settings → Script Properties → `API_KEY` |

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

## Available scripts

| Script                 | What it does                     |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start dev server                 |
| `npm run build`        | Production build                 |
| `npm run start`        | Start production server          |
| `npm run typecheck`    | TypeScript type check            |
| `npm run lint`         | ESLint                           |
| `npm run format`       | Prettier (writes)                |
| `npm run format:check` | Prettier (read-only, used by CI) |
| `npm test`             | Vitest unit tests (watch mode)   |
| `npm test -- --run`    | Vitest single run                |

## Docker deployment

### Quick start

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

The container exposes port `3000` and includes a health check at `/api/health`.

### Environment variables with Docker

Pass variables directly or via a `.env` file in the same directory as `docker-compose.yml`:

```bash
DASHBOARD_SECRET=your-strong-password \
APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec \
APPS_SCRIPT_API_KEY=your-api-key \
docker compose up -d
```

### Manual Docker build

```bash
docker build -t sas-gemini-dashboard .
docker run -p 3000:3000 \
  -e DASHBOARD_SECRET=... \
  -e APPS_SCRIPT_URL=... \
  -e APPS_SCRIPT_API_KEY=... \
  sas-gemini-dashboard
```

## Architecture

```
src/
├── app/
│   ├── (dashboard)/          # Authenticated pages (share nav layout)
│   │   ├── page.tsx          # / → Overview
│   │   ├── divisions/        # /divisions
│   │   └── user/             # /user?email=...
│   ├── login/                # /login (no nav)
│   └── api/
│       ├── usage/            # GET /api/usage
│       ├── students/         # GET /api/students
│       ├── divisions/        # GET /api/divisions
│       ├── user/             # GET /api/user?email=...
│       ├── auth/login/       # POST /api/auth/login
│       ├── auth/logout/      # POST /api/auth/logout
│       └── health/           # GET /api/health
├── components/
│   ├── Navigation.tsx
│   ├── overview/OverviewClient.tsx
│   ├── divisions/DivisionsClient.tsx
│   └── user/UserProfileClient.tsx
├── lib/
│   ├── sheets.ts             # Apps Script API fetch helpers
│   ├── auth.ts               # Cookie auth utilities
│   └── cache.ts              # 5-minute in-memory cache
└── types/index.ts            # Shared TypeScript interfaces
```

### Data flow

```
Browser → Next.js API route → lib/sheets.ts → Apps Script JSON API → Google Sheet
                           ↑
                      5-min cache
```

### Authentication

Cookie-based: the login page POSTs to `/api/auth/login`, which sets an `httpOnly` cookie (`sas-auth`) valid for 8 hours. The Next.js middleware (`middleware.ts`) protects all routes except `/login`, `/api/auth/*`, and `/api/health`.

## Testing

```bash
npm test -- --run        # run once
npm test                 # watch mode
```

Tests live in `src/__tests__/` and cover:

- `cache.test.ts` — TTL expiry, reads, overwrites
- `auth.test.ts` — password verification, cookie validation, cookie options

## Production build notes

`next.config.ts` sets `output: 'standalone'`, which bundles only the files needed to run the server. The Dockerfile copies `.next/standalone` and `.next/static` into the final image, keeping it lean.
