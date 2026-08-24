# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**BandManager.ai** (internally "Bakandeya") is a full-stack platform for independent bands: booking CRM, tour logistics, EPK (electronic press kit), repertoire/setlists, finances, fan capture, and AI agents that scout venues and draft/send booking emails on a band's behalf. It's the technical core of a Master's thesis (TFM) on AI-agent-assisted software development — see `AGENTS.md` for the project's non-negotiable business rules, which take precedence over general conventions below.

## Commands

```bash
npm run dev      # tsx server.ts — runs the Express server (serves API + Vite-built frontend)
npm run build     # vite build (frontend) + esbuild bundles server.ts -> dist/server.cjs
npm start         # node dist/server.cjs — run the production build
npm run lint      # esbuild dry-run bundle check of server.ts + src/main.tsx (not eslint)
npm test          # vitest run — runs the full suite once
```

Run a single test file or test case with vitest directly:

```bash
npx vitest run server/utils/__tests__/bandAccess.test.ts
npx vitest run -t "some test name"
npx vitest        # watch mode
```

Type checking is not an npm script; CI runs `npx tsc --noEmit` directly (see below).

### CI (`.github/workflows/ci.yml`)

On every push/PR, CI runs, in order: `npx tsc --noEmit` (see gate below), `npm run lint`, `npm test`. Match this locally before pushing.

**tsc error-count ratchet:** the codebase currently has a nonzero baseline of `tsc` errors (see `BASELINE` in the workflow file). CI fails if the total error count exceeds that baseline — so it's fine to leave *pre-existing* type errors alone, but never add new ones on top. Separately, CI has **zero tolerance** for `TS2304`/`TS2551`/`TS2552` (undeclared name / missing import / nonexistent method) anywhere, since those are guaranteed runtime crashes, not just type nits.

## Architecture

### Two runtimes, one deploy artifact

- **Frontend**: React 19 + Vite, entry `src/main.tsx` → `src/App.tsx`. Path alias `@/*` maps to the repo root (see `vite.config.ts` / `tsconfig.json`).
- **Backend**: Express app defined in `server.ts` at the repo root, with routers mounted under `/api/*` from `server/routes/*.ts`. `npm run build` bundles `server.ts` to `dist/server.cjs` (via esbuild) alongside the Vite-built static frontend; `npm start` runs that single bundle, which serves both the API and the static assets.
- **Deploy targets**: Railway (`railway.json`, `nixpacks.toml`, healthcheck at `/api/health`) is the primary target. `api/index.ts` (`export default app` from `server.ts`) exists for Vercel's serverless function convention (`vercel.json` rewrites `/api/*` there); don't assume both are equally maintained.
- **`app/applet/`** and `assets/.aistudio/` are Google AI Studio applet scaffolding (the project originated as an AI Studio applet — see `metadata.json`, `.env.example`'s references to `APP_URL`/AI Studio secret injection). Treat these as legacy/parallel packaging, not the primary app path.

### Data layer: Supabase is the only source of truth

Per `AGENTS.md`, **Supabase (Postgres) is the single source of truth** — Google Sheets is fully retired and must never be reintroduced or referenced. `server/db.ts` re-exports all DB access from `server/db/*.ts` modules, split by domain (`bands.ts`, `leads.ts`, `concerts.ts`, `tours.ts`, `payments.ts`, `epk.ts`, `fans.ts`, `social.ts`, `webhooks.ts`, `agentSchedule.ts`, `emailAccounts.ts`, etc.). `server/state.ts` builds/seeds in-memory app state (`loadState`/`saveState`) from `src/db_seed.ts` initial data merged with Supabase (`loadStateFromSupabase` in `server/db.ts`) — this in-memory `state` object (leads, concerts, rehearsals, payments, users, bands, tours...) is what most route handlers and `GET /api/state`-style endpoints read/write against.

### Multi-tenancy: everything is scoped by band

A user can belong to multiple bands (`AuthContext.availableBands`, switched via `handleSwitchBand`/`setMainBand`). The active band travels as the `x-band-id` header (set in `src/services/api.ts` from the current user), and server-side every route must resolve the target band through **`getTargetBandId(req)`** in `server/utils/bandAccess.ts` — never read `req.body.bandId` or the header directly. That helper only honors an explicit band header if the authenticated user actually belongs to it (or is a platform admin); otherwise it falls back to the user's own `band_id`. This exists specifically to close a cross-tenant data leak (see the comment in that file) — any new route touching band-scoped data must go through it.

### Auth

Session-based auth lives in `server/auth.ts`: `hashPassword`/`verifyPassword` (PBKDF2, with a legacy 1000-iteration fallback for old hashes), `ACTIVE_SESSIONS` (in-memory), and `getUserFromRequest`. Middleware factories — `createAuthMiddleware` (`requireAuth`), `createLeaderMiddleware` (`requireLeader`), `createCronOrAuthMiddleware` (`requireCronOrAuth`, gated by `CRON_SECRET` for internal/Postgres-trigger calls without a user session) — are built from `loadState`, not imported as singletons. `loginRateLimiter` (`server/middleware/rateLimiter.ts`) guards the login endpoint.

### The booking AI agents (human-in-the-loop, mandatory)

This is the most business-critical subsystem — read `AGENTS.md` section 3 in full before touching it. Four conceptual agents operate on leads through a two-dimensional state machine (CRM funnel `estado` × agentic sub-status like `pendiente_aprobacion`/`aprobado_propuesta`/`aprobado_respuesta`):

- **Scout** (`server/utils/scoutLeads.ts`, `server/auto_enrichment.ts`) — discovers/enriches venue leads.
- **Redactor** — drafts a personalized pitch, sets sub-status `pendiente_aprobacion`.
- **Human approval** — a person must approve (`aprobado_propuesta`/`aprobado_respuesta`) before anything is sent. The app **never** auto-sends without this.
- **Enviador** (`server/services/agentEngine.ts`, `server/services/emailAgentClient.ts`) — dispatches only approved records, respecting rate limits.
- **Lector** — monitors inbound replies via IMAP, updates the email thread, transitions leads to `respondido`/`negociando`.

`server/services/agentScheduler.ts` runs a 60s-tick in-process scheduler (per-band send/read windows from `band_schedules`, configured via `BandScheduleConfig.tsx`) and persists "already ran this hour" state in Supabase (`agent_schedule_state`) specifically so a Railway redeploy doesn't cause duplicate sends. `AGENT_EMAIL_MODE` env var gates real sending: defaults to `draft` (safe — drafts only, never sends) and only sends real email when explicitly set to `send`.

Each band connects its own SMTP/IMAP mailbox (app password) stored per-band in Supabase (`band_email_accounts`) — there are no global email credentials in env vars.

### Frontend structure

- `src/App.tsx` is the large top-level shell for the authenticated panel (CRM, calendar, reels, repertoire, etc.); `src/hooks/useAppData.ts` is the central data-fetching hook (pulls the whole app state via `api.getState()`, dedupes by id, exposes per-domain state + a `syncStatus`).
- `src/components/` holds top-level feature components (CRM, Booking CRM, EPK Manager, Tour Manager, Finanzas, Repertorio, Reels Center, etc.), each with an adjacent lowercase subfolder (`bandCRM/`, `booking/`, `fans/`, `finanzas/`, `reels/`, `repertorio/`, `song_studio/`, `dashboard/`, `common/`) for their sub-components.
- `src/main.tsx` special-cases the route: `/epk` is the **only public route** (band press-kit link sent to venues/press who have no account) and is rendered *outside* `LanguageProvider` on purpose — that provider injects the Google Translate widget, which mangles proper nouns/band names and would fight the EPK's own language selector (`useEpkLanguage`). Don't move `PublicEPK` inside `LanguageProvider`.
- `src/services/api.ts` / `src/utils/api.ts` — fetch wrapper that attaches auth + `x-band-id` headers; add new endpoints here rather than calling `fetch` ad hoc from components.
- `src/i18n/` — translation dictionaries for EPK/fan-facing public pages (separate from the Google Translate widget used for the internal app).

### Security-sensitive conventions (established the hard way — see inline comments)

- **SSRF guard**: any server-side `fetch()` of a user-supplied URL (lead website enrichment, etc.) must go through `esUrlExternaSegura` in `server/utils/ssrfGuard.ts`, which blocks private/reserved IP ranges and re-validates the DNS-resolved IP (not just the literal host) to prevent DNS-rebinding bypass.
- **Uploads**: static files under `/uploads` are served with `X-Content-Type-Options: nosniff` (`server.ts`) so the browser can't MIME-sniff around type validation done in `server/routes/upload.ts`.
- **Unhandled rejections**: `server.ts` installs a process-wide `unhandledRejection` handler that logs and keeps the process alive, because an uncaught async rejection in any router (Node 22 default behavior) would otherwise crash the server for *every* band, not just the failing request. New async route handlers should still use try/catch, but this is the safety net.
- **Band-scoped exports**: `GET /api/download-excel` and similar bulk-export endpoints must filter by the authenticated user's `band_id` — this used to leak all bands' data to anyone who knew the URL.

### Testing

Vitest tests live in `__tests__/` subfolders next to the code they cover (`server/__tests__`, `server/db/__tests__`, `server/routes/__tests__`, `server/services/__tests__`, `server/utils/__tests__`, `src/hooks/__tests__`, `src/i18n/__tests__`, `src/utils/__tests__`). There's no central `vitest.config.ts`; add new tests as `*.test.ts` next to the module in a nearby `__tests__` folder.
