---
name: code-graph-navigator
description: Guía de navegación determinista y mapeo de dependencias de la arquitectura de BandManager.io (frontend React 19, backend Express, agentes IA, capa de persistencia Supabase). Usar al planificar refactors, rastrear flujos de datos cruzados o explorar dependencias del codebase.
---

# 🗺️ Skill: Code Graph Navigator (Determinismo y Trazabilidad de Arquitectura)

Esta skill proporciona los mapas mentales de dependencias, grafos de flujo y reglas de navegación determinista para explorar y modificar **BandManager.io** sin alucinaciones de rutas, sin lectura redundante de archivos y con máxima eficiencia de contexto.

---

## 🧭 1. Grafo de Arquitectura y Flujos End-to-End

```
+-----------------------------------------------------------------------------------+
| 1. CAPA FRONTEND (React 19 + Tailwind v4 + Lucide)                                |
| src/App.tsx -> src/components/ (BookingCRM, RepertorioSetlists, ReelsCenter, etc)|
| Hooks: src/hooks/ (useAppData, useAuth, useBookingPipeline, useNotificationSystem)|
+-----------------------------------------------------------------------------------+
                                         │  (HTTP / SSE / WebSocket)
                                         ▼
+-----------------------------------------------------------------------------------+
| 2. ENTRADA BACKEND & MIDDLEWARE (Express 4 + TS)                                  |
| server.ts -> server/auth.ts (requireAuth, requireLeader)                          |
|           -> server/middleware/rateLimiter.ts (iaRateLimiter, loginRateLimiter)   |
|           -> server/utils/bandAccess.ts (getTargetBandId - TRUST BOUNDARY)       |
+-----------------------------------------------------------------------------------+
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
+──────────────────────+  +─────────────────────────────+  +──────────────────────+
| 3A. RUTAS API        |  | 3B. AGENTES & SCHEDULER     |  | 3C. MOTOR DE IA      |
| server/routes/*.ts   |  | server/services/*.ts        |  | server/ai.ts         |
| (leads, tours,       |  | (agentEngine, lectorAgent,  |  | server/services/     |
|  repertorio, billing)|  |  agentScheduler, queue)     |  |  pitchEngine.ts      |
+──────────────────────+  +─────────────────────────────+  +──────────────────────+
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         ▼
+-----------------------------------------------------------------------------------+
| 4. CAPA DE PERSISTENCIA (Dual-Layer Sync)                                         |
| server/db/*.ts (dbUpsertLeads, dbGetConcerts, aiLedger, bands, etc.)              |
| ├── Sincronización en memoria: server/state.ts                                    |
| └── Fuente de verdad: Supabase PostgreSQL (supabase/migrations/, supabase_schema.sql)|
+-----------------------------------------------------------------------------------+
```

---

## 🔍 2. Mapa de Dependencias por Dominio

### A. Módulo de Booking CRM & Agentes de Negociación
- **UI:** `src/components/BookingCRM.tsx`, `src/components/booking/LeadsTable.tsx`, `src/components/booking/VenueDetailPanel.tsx`
- **Hooks:** `src/hooks/useBookingPipeline.ts`, `src/hooks/useNegotiationSimulation.ts`
- **Rutas API:** `server/routes/leads/*.ts` (`crud.ts`, `pitch.ts`, `reply.ts`, `enrichment.ts`, `simulation.ts`)
- **Servicios:** `server/services/agentEngine.ts`, `server/services/lectorAgent.ts`, `server/services/pitchEngine.ts`
- **Persistencia:** `server/db/leads.ts`, `server/db/leadMessages.ts`, `server/db/pitchLearning.ts`

### B. Módulo de Repertorio, Setlists & Audio
- **UI:** `src/components/RepertorioSetlists.tsx`, `src/components/repertorio/*.tsx`, `src/components/SongStudioModal.tsx`
- **Utilidades de Audio:** `src/utils/transitionAudioEngine.ts`, `src/utils/audioCueDetector.ts`, `src/utils/musicTheory.ts`
- **Rutas API:** `server/routes/repertorio.ts`, `server/routes/songs/index.ts`, `server/routes/ai_music.ts`
- **Persistencia:** `server/db/repertoire.ts`, `server/db/stemsCache.ts`

### C. Módulo de Finanzas, Planes & Billing
- **UI:** `src/components/Finanzas.tsx`, `src/components/Planes.tsx`, `src/components/PlanLimitModal.tsx`
- **Guardias de Plan:** `server/utils/planLimits.ts` (servidor) vs `src/utils/planPermissions.ts` (cliente)
- **Rutas API:** `server/routes/billing.ts`, `server/routes/donations.ts`
- **Persistencia:** `server/db/payments.ts`, `server/db/aiLedger.ts`

---

## ⚡ 3. Reglas de Localización Quirúrgica de Código

1. **Antes de editar:** Consulta este grafo para identificar qué capas cruza el cambio (UI ➔ Route ➔ DB Handler ➔ Schema).
2. **Evitar búsquedas recursivas a ciegas:** Utiliza las rutas canónicas listadas en este mapa en lugar de hacer escaneos masivos de texto.
3. **Validación de impacto:** Si modificas una firma en `server/db/*.ts`, actualiza siempre sus llamadas correspondientes en `server/routes/*.ts` y los tests en `server/db/__tests__/*.test.ts`.

---

## ✅ Checklist de Navegación Determinista

- [ ] ¿Identificaste el punto de entrada UI y su endpoint de backend asociado?
- [ ] ¿Verificaste si la función de DB requiere `bandId` resuelto por `getTargetBandId(req)`?
- [ ] ¿Comprobaste si el cambio afecta tanto al estado en memoria (`server/state.ts`) como a Supabase?
- [ ] ¿Revisaste los tests unitarios vinculados en `server/__tests__/` o `src/utils/__tests__/`?
