# 🎯 AGENT_CONTEXT.md - Lo Que Todo Agente Debe Saber

**Este archivo es el punto de entrada rápido para agentes y skills. Léelo primero.**

---

## 📍 En 60 Segundos

**BandManager.ai** = plataforma SaaS para booking + IA agents de bandas independientes.

- **DB:** Supabase (Postgres) = single source of truth. Google Sheets: NEVER.
- **Stack:** React 19 (frontend) + Express (backend) + Node 22
- **Deploy:** Railway
- **Multi-tenancy:** Cada banda es un tenant aislado. Trust boundary: `getTargetBandId(req)`
- **AI Agents:** Scout (encuentra salas), Redactor (genera pitches), Enviador (envía emails), Lector (monitorea respuestas)
- **Human-in-the-Loop:** NUNCA email automático sin aprobación humana explícita
- **Key Rules:** SSRF guard, rate limiting en endpoints de IA, 0 new TypeScript errors, aprobación obligatoria antes de envío

---

## 🎯 Skills Especializados (Agnósticos de Tool)

Cada skill tiene **checklist, patrones detallados, anti-patterns y ejemplos de código**. 

**Ubicación unificada:** `/skills/SKILL_NAME/SKILL.md` (funciona en Claude Code, AI Studio, Copilot, etc.)

| Tarea | Skill | Propósito |
|-------|-------|----------|
| **Modificar agentes IA** (Scout, Redactor, Enviador, Lector, scheduler) | [agentic-harness](../skills/agentic-harness/SKILL.md) | Máquina de estados 2D, ciclo de vida, human-in-the-loop, scheduling |
| **Seguridad & Multi-tenancy** (getTargetBandId, SSRF, rate limit, plan limits) | [security-multitenancy](../skills/security-multitenancy/SKILL.md) | Trust boundary, fuga cross-tenant prevention, checklist pre-PR |
| **Frontend & Backend** (React 19, Express, Vitest, UX excellence) | [fullstack-ux-design](../skills/fullstack-ux-design/SKILL.md) | Glassmorphism, micro-animaciones, async/await patterns, testing |
| **Base de Datos** (Supabase, handlers, migraciones SQL, RLS, tipos TS) | [supabase-architect](../skills/supabase-architect/SKILL.md) | Arquitectura de datos, convenciones handlers, migraciones idempotentes |

**Regla:** Si el checklist de AGENT_CONTEXT.md no te cubre, ve al skill correspondiente → find detallado + checklist extendido + ejemplos.

**Multi-tool:** `.gemini/skills/` y `.claude/skills/` (si existen) son symlinks/copias de `/skills/`. Lee desde `/skills/` como single source of truth.

---

## 🏗️ Arquitectura de Un Vistazo

```
┌─────────────────────────────────┐
│      React App (frontend)       │
│      npm run dev                │
└────────────┬────────────────────┘
             │ HTTP + Auth headers
             ▼
┌─────────────────────────────────┐
│   Express API (backend)         │
│   server.ts → /api/*            │
│   npm start                     │
└────────────┬────────────────────┘
             │ getTargetBandId(req)
             │ requireAuth, Rate Limit
             ▼
┌─────────────────────────────────┐
│  Supabase (PostgreSQL)          │
│  Single Source of Truth         │
└─────────────────────────────────┘
```

**Build:** `npm run build` → Vite (frontend) + esbuild (backend) → 1 artifact → `npm start` serves ambos.

---

## 🔒 Seguridad: Lo Más Importante

### Rule 1: Trust Boundary Obligatorio

```typescript
// ✅ CORRECTO
const bandId = getTargetBandId(req);  // Valida sesión
const data = await dbGetData(bandId);

// ❌ PROHIBIDO: Cross-tenant leak
const data = await dbGetData(req.body.bandId);  // FALLO
```

Toda ruta que toca datos de banda DEBE usar `getTargetBandId(req)` (en `server/utils/bandAccess.ts`).

### Rule 2: Endpoints de IA = `requireAuth` + `iaRateLimiter`

```typescript
app.post('/api/generate-music', requireAuth, iaRateLimiter, handler);
```

### Rule 3: Fetch Externo = SSRF Guard

```typescript
esUrlExternaSegura(url);  // Bloquea IPs privadas + re-valida DNS
```

### Rule 4: Aprobación Humana Antes de Envío

Ningún email se envía sin que un humano apriete "Aprobar" en la UI.

---

## 🤖 Agentes de Booking: Flujo Completo

```
1. SCOUT discovers venues
   → creates lead in estado: "nuevo"

2. REDACTOR generates pitch
   → lead.pitch_generado = "Hola [venue]..."
   → agentic_status: "pendiente_aprobacion"

3. HUMAN REVIEWS & APPROVES
   → agentic_status: "aprobado_propuesta"
   → Si rechaza: agentic_status = "" (vuelve a nuevo)

4. ENVIADOR sends email
   → respeta AGENT_EMAIL_MODE env (draft vs send)
   → respeta dispatch_mode per band (draft_gmail vs direct_send)
   → estado: "contactado" o "esperando_respuesta"

5. LECTOR monitors replies
   → detecta respuestas → estado: "respondido"
   → detecta drafts manuales → estado: "contactado"
```

**Critical:** Steps 1-4 require `AGENT_EMAIL_MODE=send` AND human approval (step 3).

---

## 📊 Estados del Lead (2D: CRM × Agentic)

### CRM Funnel (estado)
- `nuevo` → `contactado` → `respondido` → `negociando` → `confirmado`
- O: `nuevo` → `no_interesado` / `aplazado`

### Agentic Sub-status (agentic_status)
- (empty) — no en cola agéntica
- `pendiente_aprobacion` — pitch generado, espera OK humano
- `aprobado_propuesta` — OK, listo para envío
- `aprobado_respuesta` — reply a sala, OK para envío
- `borrador_creado` — borrador en Gmail, esperando envío manual o auto

---

## 🚀 Tech Stack Cheat Sheet

| Layer | Tech | Key Files |
|-------|------|-----------|
| **Frontend** | React 19 + Vite + Tailwind | `src/main.tsx` → `src/App.tsx` |
| **Backend** | Express + TypeScript | `server.ts` → `server/routes/*.ts` |
| **Database** | Supabase (Postgres) | `server/db/*.ts` |
| **Auth** | JWT + PBKDF2 | `server/auth.ts` |
| **Storage** | Supabase Storage | Clips de reels, PDFs |
| **Scheduling** | In-process (Node) | `server/services/agentScheduler.ts` |
| **Email** | Gmail API OAuth2 + IMAP/SMTP | `server/services/gmailApiClient.ts` |

---

## 📋 Checklist para Cualquier Change

Antes de pushear código:

- [ ] `npm run tsc --noEmit` → 0 errores TypeScript nuevo
- [ ] `npm run lint` → pasa (esbuild can bundle)
- [ ] `npm test` → tests verdes
- [ ] Multi-tenancy: ¿usé `getTargetBandId(req)`?
- [ ] Async handlers: ¿tienen try/catch?
- [ ] IA endpoints: ¿`requireAuth` + `iaRateLimiter`?
- [ ] Fetch externo: ¿`esUrlExternaSegura(url)`?
- [ ] Commit message: explica el POR QUÉ (no solo QUÉ)
- [ ] Diff es quirúrgico (no refactores acoplados)

---

## 🎯 Tareas Comunes para Agentes

### "Quiero agregar una nueva ruta `/api/leads`"

1. Crea handler en `server/routes/leads.ts` (o nuevo archivo)
2. Aplica middleware:
   ```typescript
   app.get('/api/leads', requireAuth, withBandId, async (req, res) => {
     const bandId = req.bandId;  // Ya validado por withBandId
     const leads = await dbGetLeads(bandId);
     res.json(leads);
   });
   ```
3. Llama función DB desde `server/db/leads.ts`:
   ```typescript
   export async function dbGetLeads(bandId: string) {
     return supabase.from('leads')
       .select('*')
       .eq('band_id', bandId)  // CRUCIAL: filter by bandId
       .order('created_at', { ascending: false });
   }
   ```
4. Test: unidad, no HTTP:
   ```typescript
   import { getTargetBandId } from '../utils/bandAccess';
   it('blocks user a from reading user b leads', () => {
     const req = { user: { band_id: 'a' }, headers: { 'x-band-id': 'b' } };
     expect(() => getTargetBandId(req)).toThrow();
   });
   ```
5. Push:
   - `git add server/routes/leads.ts server/db/leads.ts ...`
   - Commit con mensaje que explique el POR QUÉ

### "Quiero agregar validación de límite de plan"

1. Lee `server/utils/planLimits.ts` para ver estructura
2. En el handler, después de auth:
   ```typescript
   const bandId = getTargetBandId(req);
   const currentLeads = await dbCountLeads(bandId);
   checkRecordLimit(bandId, 'leads', currentLeads);  // ← VALIDACIÓN SERVER
   ```
3. NUNCA solo confíes en `src/utils/planPermissions.ts` (UI-only)
4. Test: servidor rechaza si límite excedido

### "Quiero mejorar el UI de la pantalla de aprobación de leads"

1. Editá `src/components/booking/LeadCard.tsx` (o modal)
2. Recuerda: **contenido primero** (el pitch), metadata después
3. En móvil (~390px): max 3 bloques sin scroll
4. Acciones secundarias: detrás de menú (`⋯`)
5. Validá en Chrome DevTools (responsive mode) ANTES de merge
6. Dark mode: probá `bg-white dark:bg-slate-900`

---

## 🔗 Archivos Clave por Tarea

### Seguridad & Multi-tenancy
- `server/utils/bandAccess.ts` — getTargetBandId()
- `server/utils/ssrfGuard.ts` — esUrlExternaSegura()
- `server/auth.ts` — autenticación, sessions
- `server/middleware/rateLimiter.ts` — rate limits

### Agentes IA
- `server/utils/scoutLeads.ts` — Scout agent
- `server/services/agentEngine.ts` — Redactor + Enviador
- `server/services/lectorAgent.ts` — Lector
- `server/services/agentScheduler.ts` — Scheduler (60s tick)

### Data Layer
- `server/db/leads.ts` — CRUD de leads
- `server/db/bands.ts` — Bandas y configuración
- `server/db/concerts.ts` — Conciertos
- `server/state.ts` — cargar/guardar estado en memoria

### Frontend
- `src/App.tsx` — Shell principal
- `src/components/booking/` — CRM + agentes UI
- `src/services/api.ts` — Fetch wrapper (inyecta auth + bandId)
- `src/hooks/useAppData.ts` — Central state hook

### Testing
- `server/db/__tests__/bandIdTrustBoundary.test.ts` — ⚠️ CRÍTICO: Escaneo estático multi-tenancy
- `server/utils/__tests__/bandAccess.test.ts` — Tests de trust boundary
- `server/__tests__/auth_bandas.test.ts` — Auth + multi-tenancy

### Configuración
- `vite.config.ts` — Build frontend + path aliases
- `tsconfig.json` — TypeScript strict
- `vitest.config.ts` — Testing setup
- `server.ts` — Entry point backend, error handlers

---

## 🚨 Errores Comunes (Evita)

| Error | Síntoma | Fix |
|-------|---------|-----|
| Cross-tenant leak | User A lee datos de User B | Usa `getTargetBandId()` |
| Async sin try/catch | Promesa rechazada mata servidor | Envuelve en try/catch |
| Confianza en plan UI | Bypassean límites vía HTTP | Valida server-side con `checkRecordLimit()` |
| Email no aprobado | Pitch se envía sin humano | Requiere `agentic_status: aprobado_propuesta` |
| SSRF en fetch | Accede a metadata de GCP | Valida con `esUrlExternaSegura()` |
| `any` implícito | CI falla | Tipado estricto, no `any` nuevo |
| Flex-wrap móvil | Buttons en 6 filas | `hidden sm:flex` / `sm:hidden` |

---

## 📚 Lee Esto Cuando Toques Esto

| Si tocas... | Lee primero (context/) | Luego: Skill → `/skills/SKILL_NAME/SKILL.md` |
|-------------|---------|----------|
| Ruta de backend + multi-tenancy | SECURITY.md #2 | security-multitenancy |
| Agentes (Scout/Redactor/Enviador/Lector) | BUSINESS_RULES.md | agentic-harness |
| UI (componentes React) | UI_UX_GUIDELINES.md | fullstack-ux-design |
| DB (nuevo schema, queries, migraciones) | ARCHITECTURE.md #2 | supabase-architect |
| Tests (Vitest, unit/integration) | CODE_STANDARDS.md #4 | fullstack-ux-design |
| Fetch externo (scraping, enrichment) | SECURITY.md #4 (SSRF) | security-multitenancy |

---

## ⚡ Quick Links

- **Full CLAUDE.md:** `/home/user/BandsManager/CLAUDE.md`
- **Full AGENTS.md:** `/home/user/BandsManager/AGENTS.md`
- **Project Structure:** `context/PROJECT_OVERVIEW.md`
- **Architecture Deep Dive:** `context/ARCHITECTURE.md`
- **Security Rules:** `context/SECURITY.md`
- **AI Agents Spec:** `context/BUSINESS_RULES.md`
- **Code Standards:** `context/CODE_STANDARDS.md`
- **UI/UX Rules:** `context/UI_UX_GUIDELINES.md`

---

## 🎤 Tono & Estilo

- **Directo, sin rodeos:** Di "no" si algo es mala idea
- **Técnico:** No expliques básicos (todo el equipo es senior)
- **Honesto:** Si algo está roto, di la verdad
- **Conciso:** Respuestas breves, acciones claras

---

## 🎸 Misión del Proyecto

Bandas independientes bookin, logística, prensa, repertorio, IA agents que automatizan pitch + sending (siempre con aprobación humana).

**Principio:** IA multiplica productividad de un solo dev. Simplicidad en pantalla, complejidad en backend.

---

**¿Preguntas?** Lee los archivos `context/` en orden: PROJECT_OVERVIEW → ARCHITECTURE → SECURITY → BUSINESS_RULES → CODE_STANDARDS → UI_UX_GUIDELINES.

