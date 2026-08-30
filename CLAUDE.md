# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**BandManager.ai** (internally "Bakandeya"; the product name churned through BandManager.ai → .io → .oi → back to .ai in four commits, see `index.html`'s `<title>`/meta tags if it ever moves again) is a full-stack platform for independent bands: booking CRM, tour logistics, EPK (electronic press kit), repertoire/setlists, finances, fan capture, a Reels/social-content generator, AI music tools (rhythmic-base generation, instrument synthesis, MIDI export), booking campaigns, and AI agents that scout venues and draft/send booking emails on a band's behalf. It's the technical core of a Master's thesis (TFM) on AI-agent-assisted software development — see `AGENTS.md` for the project's non-negotiable business rules, which take precedence over general conventions below.

`package.json`'s `name` field is still the original Vite scaffold name (`react-example`) and was never updated through any of the rebrands — everywhere user-facing is consistently "BandManager.ai" as of the latest rebrand commit.

## Commands

```bash
npm run dev         # tsx server.ts — runs the Express server (serves API + Vite-built frontend)
npm run build       # vite build (frontend) + esbuild bundles server.ts -> dist/server.cjs
npm start           # node dist/server.cjs — run the production build
npm run lint        # esbuild dry-run bundle check of server.ts + src/main.tsx (not eslint - see below)
npm run lint:eslint  # real ESLint (typescript-eslint + react-hooks), not wired into CI yet
npm test            # vitest run — runs the full suite once
npm run test:coverage  # vitest run --coverage
```

`npm run lint:eslint` is separate from `npm run lint` on purpose: CI's `lint` step needs to keep meaning "esbuild can still bundle this," so ESLint was added alongside it rather than replacing it. It currently reports ~2500 findings (`eslint.config.js`), split roughly 1420 `no-explicit-any` + 800 `no-unused-vars` (matches the loose-typing debt tracked by the `tsc` baseline below) plus a long tail of `react-hooks/*` findings — `rules-of-hooks` violations (hooks called after an early `return null`, so a hook count that changes between renders) have already been fixed in the 7 components that had them; the rest (`set-state-in-effect`, `purity`, `exhaustive-deps`, `no-empty`, `no-useless-assignment`) are open. Not wired into CI: fixing the bulk of it (mostly `any`) is a real, separate effort, not something to silently ratchet like `tsc`.

Run a single test file or test case with vitest directly:

```bash
npx vitest run server/utils/__tests__/bandAccess.test.ts
npx vitest run -t "some test name"
npx vitest        # watch mode
```

Type checking is not an npm script; CI runs `npx tsc --noEmit` directly (see below).

### CI (`.github/workflows/ci.yml`)

On every push/PR, CI runs, in order: `npx tsc --noEmit` (see gate below), `npm run lint`, `npm test`. Match this locally before pushing.

**tsc error-count ratchet:** CI fails if `npx tsc --noEmit`'s total error count exceeds `BASELINE` in the workflow file (currently `5`, lowered from a stale `118` now that the real count is `0` — small margin so one minor `@types/*` bump doesn't break CI outright) — so it's fine to leave *pre-existing* type errors alone, but never add new ones on top. Separately, CI has **zero tolerance** for `TS2304`/`TS2551`/`TS2552` (undeclared name / missing import / nonexistent method) anywhere, since those are guaranteed runtime crashes, not just type nits.

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

The same trust boundary applies one layer down, in `server/db/*.ts`: every `dbUpsertX(objeto, bandId)` receives `bandId` already resolved by the route from the session — that parameter is the only trusted source. A systemic bug (found while auditing the AI-Studio-authored `campaigns.ts`) had many of these functions instead compute `cleanBandId(objeto.band_id || bandId)`, letting an unvalidated `band_id` from the request **body** override the session's — any authenticated user could write into another band's data by just adding `"band_id": "otra-banda"` to the payload. Fixed across `campaigns`/`leads`/`fans`/`contacts`/`concerts`/`payments`/`rehearsals`/`repertoire`/`social`/`tours`; `server/db/__tests__/bandIdTrustBoundary.test.ts` statically scans every `server/db/*.ts` file (`users.ts` excepted — it manages `band_id` itself, not the same pattern) for the dangerous `cleanBandId(x.band_id || ...)` shape, so a new file that reintroduces it fails CI even without a dedicated test.

### Auth

Session-based auth lives in `server/auth.ts`: `hashPassword`/`verifyPassword` (PBKDF2, with a legacy 1000-iteration fallback for old hashes), `ACTIVE_SESSIONS` (in-memory), and `getUserFromRequest`. Middleware factories — `createAuthMiddleware` (`requireAuth`), `createLeaderMiddleware` (`requireLeader`), `createCronOrAuthMiddleware` (`requireCronOrAuth`, gated by `CRON_SECRET` for internal/Postgres-trigger calls without a user session) — are built from `loadState`, not imported as singletons. `server/middleware/rateLimiter.ts` exports `loginRateLimiter` (login endpoint) and `iaRateLimiter` (paid AI-generation endpoints like `ai_music.ts`/`chat.ts`'s `/write-reels-copy`) — any new endpoint that calls out to a metered/paid AI model needs both `requireAuth` and a rate limiter from here, not just one of the two. `CRON_SECRET` has a second, unrelated use: `server/routes/gmailOAuth.ts` HMAC-signs the OAuth `state` param with it (see the booking AI agents section below) — the Google consent redirect carries no session of its own, so that signature is what ties the callback back to the right band.

### The booking AI agents (human-in-the-loop, mandatory)

This is the most business-critical subsystem — read `AGENTS.md` section 3 in full before touching it. Four conceptual agents operate on leads through a two-dimensional state machine (CRM funnel `estado` × agentic sub-status like `pendiente_aprobacion`/`aprobado_propuesta`/`aprobado_respuesta`):

- **Scout** (`server/utils/scoutLeads.ts`, `server/auto_enrichment.ts`) — discovers/enriches venue leads.
- **Redactor** — drafts a personalized pitch, sets sub-status `pendiente_aprobacion`.
- **Human approval** — a person must approve (`aprobado_propuesta`/`aprobado_respuesta`) before anything is sent. The app **never** auto-sends without this — including for bands running the "hands-off" `dispatch_mode` below, which only changes what happens *after* this approval, never whether it happens.
- **Enviador** (`server/services/agentEngine.ts`, `server/services/emailAgentClient.ts`, `server/services/gmailApiClient.ts`) — dispatches only approved records, respecting rate limits.
- **Lector** (`server/services/lectorAgent.ts`) — monitors inbound replies, transitions leads to `respondido`/`negociando`, and detects when a Gmail draft the Enviador created got sent manually (see below).

**Two ways to reach a band's mailbox, chosen automatically per band, preferring OAuth:** Gmail "offline" OAuth (`server/routes/gmailOAuth.ts`, `server/db/gmailOAuth.ts`, `server/services/gmailApiClient.ts`, table `band_gmail_oauth_accounts`) — connect once via Google's consent screen, no app password and no popup at send/read time (a stored refresh token is exchanged for access tokens as needed, so it works unattended from the scheduler); or SMTP/IMAP with an app password (`server/db/emailAccounts.ts`, `band_email_accounts`) — the only path for Outlook/non-Gmail, and the fallback for a Gmail band that hasn't connected OAuth. Both the Enviador and Lector call `tieneGmailOAuthConectado()` and prefer OAuth whenever it's connected. `src/components/EmailAccountConfig.tsx` is the **single** UI for connecting either — it's embedded identically in `UserProfileModal.tsx` and `AgentAutonomySettingsModal.tsx`. Don't add a second, divergent "connect email" flow: one existed before (a popup-based Google sign-in local to `AgentAutonomySettingsModal.tsx`) and it silently never persisted anything server-side, so a band could "connect" there and see it reflected nowhere the scheduler actually reads.

`server/services/agentScheduler.ts` runs a 60s-tick in-process scheduler and persists "already ran this hour" state in Supabase (`agent_schedule_state`) specifically so a Railway redeploy doesn't cause duplicate sends. The Enviador still respects the band's send window (`horas_enviador`/`dias_enviador` in `band_schedules`, configured via `BandScheduleConfig.tsx`/`AgentAutonomySettingsModal.tsx`) — the Lector does **not**: it runs on every tick regardless of schedule (there's no reason to delay detecting a reply or a manually-sent draft), and the matching `horas_lector`/`dias_lector` columns are legacy, no longer read.

Two independent gates must both be true before anything sends for real — `AGENT_EMAIL_MODE` env var (platform-wide; defaults to `draft`, safe — drafts only; must be explicitly `send` for *any* band to dispatch for real) and each band's own `dispatch_mode` in `autonomy_configs` (`draft_gmail` by default — leaves a Gmail draft/IMAP draft for a last human look before it's sent — or `direct_send`, toggled per band in `AgentAutonomySettingsModal.tsx`'s "Modo de Despacho"). A band can never unlock real sending on its own; the env var is the platform's own kill switch, not something any band config can override. In `draft_gmail` mode the created draft's Gmail id is stored (`leads.gmail_draft_id`) so a later Lector tick can tell if the band sent it manually from Gmail (`comprobarBorradoresGmailEnviados` in `agentEngine.ts`, called from the Lector) and transition the lead to `contactado` instead of leaving it stuck in `borrador_creado` forever.

Each band connects its own mailbox — there are no global email credentials in env vars, except `GOOGLE_OAUTH_CLIENT_ID`/`GOOGLE_OAUTH_CLIENT_SECRET`/`GOOGLE_OAUTH_REDIRECT_URI`, which identify the *application* to Google (one shared registration) but grant no access to any band's mailbox by themselves — each band's own `refresh_token`, stored per `band_id`, is what does that. `CRON_SECRET` (see Auth below) also signs the OAuth `state` param that ties a Google consent callback back to the right band across the redirect.

### Reels generator (multi-platform, tone-aware)

`server/routes/reels.ts` + `server/services/socialRadarService.ts` scrape a band's YouTube/TikTok/Instagram/Facebook (official YouTube Data API where an API key is configured, `yt-dlp` otherwise) to find viral fragments by real audio energy (not just transcript keywords), then render clips. Rendered clips are stored in **Supabase Storage**, not on Railway's ephemeral disk — a clip generated before a redeploy would otherwise vanish. Each band has a persistent, editable "tone DNA" (`src/components/ReelsCenter.tsx`) built from scraped captions/live-show speech samples, used to keep generated titles/descriptions consistent with how the band actually talks; it's per-band state, not hardcoded to Bakandeya (this used to leak Bakandeya's own voice into every band's reels — fixed).

### AI music tools

- `server/routes/ai_music.ts` — `/api/generate` / `/api/generate-music`, calls Gemini's Lyria model to generate a soundtrack/jingle clip from a text prompt. Guarded by `requireAuth` + a rate limiter (`iaRateLimiter`) — it originally shipped from AI Studio with neither, letting anyone burn the platform's Gemini quota unauthenticated; same class of gap `/write-reels-copy` already had closed (see the comment in `chat.ts`).
- Chatbot rhythmic-base generation and instrument synthesis (guitar/violin/handpan/percussion) use `tone.js` (`src/utils/instrumentSynth.ts`, `accompanimentSynth.ts`) driven by AI-composed melodic ideas (`src/utils/musicTheory.ts`), with note validation/repair before synthesis so malformed AI output doesn't produce broken audio. Generated ideas can be downloaded as MIDI (`src/utils/midiExport.ts`) or saved into the band's repertoire.

### Booking campaigns (`server/routes/campaigns.ts`)

CRUD for outreach campaigns, newest subsystem. Used to fall back to the literal string `"bakandeya"` when `req.user.band_id` was missing — the exact cross-tenant fallback `bandAccess.ts` documents as rejected on purpose ("better an explicit 500 than silently inheriting the flagship band"). Removed.

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

The established style is unit-testing exported pure functions directly against a fake `loadState`/`req` object (see `server/__tests__/auth_bandas.test.ts`, `server/utils/__tests__/bandAccess.test.ts`) rather than spinning up the Express app with an HTTP client — there's no `supertest` in the repo, and route handlers that need coverage should have their core logic extracted into a testable helper (e.g. `server/utils/bandAccess.ts`) rather than tested through a live request.

Run `npm run test:coverage` (adds `@vitest/coverage-v8`) for a coverage report. As of this writing there are 560 tests across 56 files — `server/utils` (the auth/multi-tenancy/SSRF helpers) and the `server/db` band-scoping tests are the best-covered areas, while most `server/routes/*.ts` (large inline handlers) still have little. When adding tests, prioritize security- and multi-tenancy-sensitive logic over raw coverage percentage; the static source-scanning style of `server/db/__tests__/bandIdTrustBoundary.test.ts` (regex over the file text, not a mocked call) is worth reaching for again for a class of bug rather than one function.
