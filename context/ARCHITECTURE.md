# 🏗️ Arquitectura Técnica - BandManager.io

## 1. Runtime Dual: Frontend + Backend en Un Deploy

```
┌─────────────────────────────────────────────┐
│ npm run build                               │
├─────────────────────────────────────────────┤
│ 1. Vite build frontend → dist/              │
│ 2. esbuild bundle server.ts → dist/server.cjs
│    (Express embebido, sirve ambos)          │
└─────────────────────────────────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  npm start       │
            │  node dist/server.cjs
            │  Port 3000       │
            └──────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
    GET /* → Static (React)   GET /api/* → Express Routes
    /epk                     /api/state
    /public                  /api/leads
    /assets                  /api/concerts
                             /api/generate-music
```

### Frontend Stack
- **React 19** + **Vite** (HMR en dev, optimización en build)
- **Tailwind CSS v4** (utility-first, dark mode)
- **TypeScript** (estricto, sin `any` nuevo)
- **lucide-react** (iconos)
- **motion** (micro-animaciones)
- Path alias: `@/*` → root directory

### Backend Stack
- **Express.js** (middleware-based routing)
- **TypeScript** (compilado a JS, esbuild)
- **Node 22** (LTS actual)
- **Supabase Client** (SDK oficial)
- **nodemailer** (SMTP) + **Gmail API** (OAuth2)

---

## 2. Base de Datos: Supabase (Postgres) = Única Fuente de Verdad

### Schema Principal

```sql
-- Usuarios & Autenticación
users (id, email, password_hash, band_id, role)
band_members (user_id, band_id, role)

-- Bandas & Configuración
bands (id, name, plan, country, city)
band_schedules (band_id, horas_enviador, dias_enviador)
autonomy_configs (band_id, dispatch_mode, agentEnabled)
band_gmail_oauth_accounts (band_id, refresh_token)
band_email_accounts (band_id, email, password, smtp_host)

-- Leads & Booking (Core Agents)
leads (
  id, band_id, venue_name, venue_email, venue_country,
  estado, pendiente_aprobacion, aprobado_propuesta,
  pitch_generado, gmail_draft_id, ...
)
lead_messages (lead_id, role, content, timestamp)

-- Conciertos & Logística
concerts (id, band_id, venue_id, date, payment_status)
tours (id, band_id, name, start_date, end_date)
venues (id, name, city, country, contact_email, website)

-- Repertorio & Audio
songs (id, band_id, title, duration, tempo_bpm, key)
setlists (id, band_id, song_id, position)
song_recordings (id, song_id, audio_url)

-- Reels & Social
reels (id, band_id, platform, video_url, script, posted_at)
tone_dna (band_id, captions_sample, voice_description)

-- Fans & CRM
fans (id, band_id, email, name, capturedAt, source)
fan_segments (id, band_id, name, criteria_json)

-- Agentes & Scheduling
agent_schedule_state (band_id, last_run_hour, operation)

-- Pagos
band_plans (band_id, plan_tier, pricing_rules_json)
concert_payments (id, concert_id, amount, paid_at)
```

### Política de Acceso a Datos

```typescript
// ✅ CORRECTO: Usa bandId resuelto en sesión
const leads = await dbGetLeads(bandId);  // bandId del req ya validado

// ❌ PROHIBIDO: Lee band_id directamente del request
const leads = await dbGetLeads(req.body.bandId);  // FALLO multi-tenancy
```

---

## 3. Estado en Memoria & Sincronización

```
┌─────────────────────────────────┐
│   Express Server Inicia         │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ loadState()        │
    │ (server/state.ts)  │
    └────────┬───────────┘
             │
   ┌─────────┴──────────┐
   │                    │
   ▼                    ▼
Merge en        loadStateFromSupabase
memoria:        (server/db.ts)
- Seed          │
  datos         ▼
- Supabase    Postgres
  live
  │
  ▼
$STATE
{
  bands: {...},
  leads: {...},
  users: {...},
  concerts: {...},
  ...
}
```

**Ciclo de Sincronización:**

1. Backend carga estado inicial → `$STATE` en memoria
2. Rutas leen/escriben contra `$STATE` (en memoria)
3. Cambios se persisten en Supabase (async)
4. En deploy (Railway redeploy): estado se recarga desde Supabase
5. Webhooks de Postgres pueden disparar `saveState()` para actualizaciones externas

---

## 4. Stack de Autenticación & Autorización

### Flow: Login → JWT Session

```
POST /api/login
├─ email + password
├─ verifyPassword (PBKDF2)
├─ Crea sesión → ACTIVE_SESSIONS (in-memory)
└─ Devuelve JWT token

Requests subsecuentes:
├─ Header: Authorization: Bearer <JWT>
├─ Middleware: requireAuth → valida sesión
└─ req.user = { id, email, band_id, role }
```

### Middleware de Protección

```typescript
// Requiere usuario autenticado
app.get('/api/leads', requireAuth, handler);

// Requiere líder de banda
app.post('/api/autonomy-config', requireLeader, handler);

// Permite cron/webhook interno (con CRON_SECRET)
app.post('/api/cron-scout', requireCronOrAuth, handler);
```

### Rate Limiting

```typescript
// Endpoints de IA generativa (consumo pagado)
app.post('/api/generate-music', requireAuth, iaRateLimiter, handler);
app.post('/api/write-reels-copy', requireAuth, iaRateLimiter, handler);

// Login endpoint
app.post('/api/login', loginRateLimiter, handler);
```

---

## 5. Rutas Frontend (SPA + 1 ruta pública)

```
/                  → App.tsx (autenticado)
  /crm             → BandCRM
  /booking         → BookingCRM + AI Agents
  /calendar        → Tour Manager
  /repertorio      → Repertoire + Music Studio
  /reels           → Reels Generator
  /finances        → Payment Tracker
  /dashboard       → KPIs
  /profile         → User Settings

/epk/:bandSlug     → PublicEPK (SIN autenticación, SIN LanguageProvider)
/epk/success       → Post-signup fan form
```

---

## 6. Subsistema de Agentes IA (Human-in-the-Loop)

```
┌────────────────────────────────────────────┐
│ Flujo de Booking Agéntico (60s scheduler)  │
└────────────────────────────────────────────┘

1️⃣ SCOUT (scoutLeads.ts)
   ├─ Descubre salas nuevas (web scrape + enrichment)
   ├─ Valida via SSRF guard
   └─ Crea lead en estado "nuevo"

2️⃣ REDACTOR (agentEngine.ts)
   ├─ Lee leads en estado "nuevo"
   ├─ Llama Claude → genera pitch personalizado
   └─ Guarda en lead.pitch_generado + estado "pendiente_aprobacion"

3️⃣ HUMAN APPROVAL (UI: LeadCard.tsx)
   ├─ Usuario revisa pitch en app web
   ├─ Edita si quiere
   └─ Aprueba → transita a "aprobado_propuesta" / "aprobado_respuesta"

4️⃣ ENVIADOR (agentEngine.ts, emailAgentClient.ts)
   ├─ Lee leads aprobados
   ├─ Respeta dispatch_mode (draft_gmail vs direct_send)
   ├─ Crea draft en Gmail / envía vía SMTP
   └─ Guarda gmail_draft_id si draft_gmail

5️⃣ LECTOR (lectorAgent.ts)
   ├─ Monitorea buzón (Gmail API OAuth2 o IMAP)
   ├─ Detecta respuestas → transita a "respondido"
   ├─ Detecta drafts enviados manualmente → "contactado"
   └─ Actualiza lead_messages con hilo de conversación
```

**Gates de Seguridad:**

- ✅ `AGENT_EMAIL_MODE` env var (global kill-switch: `draft` o `send`)
- ✅ `autonomy_configs.dispatch_mode` (por banda)
- ✅ Aprobación humana OBLIGATORIA antes de envío (no omitible)

---

## 7. Almacenamiento de Archivos: Supabase Storage

```
┌───────────────────────────────────┐
│   Clips Reels (MP4)              │
│   Audio generado (WAV/MP3)       │
│   PDFs descargables              │
└───────────────────────────────────┘
         │
         ▼ (Supabase SDK)
    Supabase Storage
    (S3-compatible)
    
Nunca usar:
- Railway /tmp (efímero)
- memoria (blob limits)
```

---

## 8. Deploy: Railway + CI/CD

### CI Pipeline (.github/workflows/ci.yml)

```yaml
on: push / pull_request

1. tsc --noEmit          # Type checking (baseline: 0 errors nuevo)
2. npm run lint          # esbuild dry-run
3. npm test              # vitest run (560+ tests)
```

### Deploy Target: Railway

```toml
# nixpacks.toml
providers = ["node"]
build.commands = [
  "npm run build"
]
start.cmd = "npm start"
healthcheck = "/api/health"
```

---

## 9. Configuración & Secrets

### Variables de Entorno (Railway)

```bash
# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...

# Auth
JWT_SECRET=<algo>
CRON_SECRET=<algo>
AGENT_EMAIL_MODE=draft   # o "send"

# Gmail OAuth (aplicación)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/gmail/callback

# Gemini (para Music)
GEMINI_API_KEY=...

# Frontend
VITE_API_BASE=https://...
```

### Archivos de Configuración Clave

- `vite.config.ts` — builder frontend, path aliases
- `tsconfig.json` — opciones TypeScript
- `vitest.config.ts` — testing setup
- `eslint.config.js` — linter (2500 findings abiertos, no CI yet)

---

## 10. Testing & Calidad

```
vitest
├── server/
│   ├── __tests__/
│   │   └── auth_bandas.test.ts
│   ├── db/__tests__/
│   │   └── bandIdTrustBoundary.test.ts (CRÍTICO: escanea SSRF)
│   ├── routes/__tests__/
│   ├── services/__tests__/
│   └── utils/__tests__/
│       └── bandAccess.test.ts
├── src/
│   ├── hooks/__tests__/
│   ├── i18n/__tests__/
│   └── utils/__tests__/
```

**Cobertura Actual:** 560 tests, mejor en `server/utils` y `server/db`.

---

## Diagrama de Flujo de Datos

```
┌─────────────┐
│  Usuario    │
└──────┬──────┘
       │ Browser
       ▼
┌────────────────────┐
│   React App (SPA)  │
│   src/App.tsx      │
└──────┬─────────────┘
       │ Fetch + Auth Header
       │ x-band-id Header
       ▼
┌────────────────────┐
│   Express Routes   │
│ /api/* (server/)   │
└──────┬─────────────┘
       │ Valida:
       │ - getTargetBandId(req)
       │ - requireAuth
       │ - Rate Limit
       ▼
┌──────────────────────┐
│ server/db/*.ts       │
│ (Acceso a datos)     │
│ + $STATE (memory)    │
└──────┬───────────────┘
       │ R/W async
       ▼
┌────────────────────────────┐
│   Supabase (Postgres)      │
│   Single Source of Truth   │
└────────────────────────────┘
```

---

