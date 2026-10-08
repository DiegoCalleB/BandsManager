# 🛠️ Skills - Guías Especializadas Agnósticas de Tool

Este directorio contiene **skills reutilizables** que funcionan con cualquier herramienta de IA:
- **Claude Code** (Claude.ai)
- **Google AI Studio** (Gemini)
- **GitHub Copilot** (Codex)
- **Open Code** o similar

Cada skill es independiente y proporciona checklist, patrones detallados, anti-patterns y ejemplos de código para un área específica del proyecto.

---

## 📚 Skills Disponibles

### 1. **agentic-harness**
**Cuándo usar:** Modificar agentes IA (Scout, Redactor, Enviador, Lector) o el scheduler

- Máquina de estados 2D (CRM × Agentic)
- Ciclo de vida completo de los agentes
- Human-in-the-loop patterns
- Scheduler operation (tick de 24 h por defecto, configurable)
- Checklist de arquitectura agéntica

**Archivos clave:** `server/services/agentEngine.ts`, `server/services/lectorAgent.ts`, `server/services/agentScheduler.ts`

---

### 2. **security-multitenancy**
**Cuándo usar:** Modificar rutas de backend, endpoints API o cualquier cosa que toque datos de banda

- Trust boundary enforcement (`getTargetBandId()`)
- SSRF guard (`esUrlExternaSegura()`)
- Rate limiting en endpoints de IA
- Plan limit validation (`checkRecordLimit`)
- Bulk export filtering
- Checklist pre-PR de seguridad

**Archivos clave:** `server/utils/bandAccess.ts`, `server/utils/ssrfGuard.ts`, `server/middleware/rateLimiter.ts`, `server/utils/planLimits.ts`

---

### 3. **fullstack-ux-design**
**Cuándo usar:** Crear/refinar componentes UI o handlers de backend

- Estándares de diseño frontend (React 19, Motion, Tailwind v4)
- Glassmorphism, micro-animaciones, paleta de colores
- Estándares de backend (Express async/await patterns)
- Vitest testing conventions
- Checklist UX & backend

**Archivos clave:** `src/App.tsx`, `src/components/`, `server.ts`, `server/routes/`

---

### 4. **supabase-architect**
**Cuándo usar:** Modificar esquema de BD, crear migraciones, handlers de DB o tipos TypeScript

- Arquitectura de datos en 3 capas (Types TS → Handlers DB → State en memoria)
- Convenciones de handlers (`dbUpsertX(data, bandId)`)
- Migraciones SQL idempotentes
- Row Level Security (RLS)
- Checklist de cambios de schema

**Archivos clave:** `server/db/*.ts`, `src/types.ts`, `supabase/migrations/`, `server/state.ts`

---

### 5. **graphify**
**Cuándo usar:** Explorar relaciones complejas y navegar el mapa de dependencias del proyecto

- Análisis determinista de AST (Tree-sitter) para indexar conexiones entre archivos
- Mapeo de rutas de llamadas UI ➔ Hooks ➔ API Express ➔ DB Handlers ➔ Supabase
- Trazabilidad de dependencias y análisis de impacto de cambios
- Detección de código huérfano

---

### 6. **llm-evals-benchmark**
**Cuándo usar:** Validar o modificar prompts de agentes, evaluar calidad de respuestas y benchmarks

- Matriz de métricas cuantitativas (Read Aloud Score, Hallucination Rate, Rule of 20%)
- Protocolo de evaluación ciega con Golden Dataset de salas
- Tests automatizados de robustez de prompts en Vitest

---

### 7. **tdd-regression-guardian**
**Cuándo usar:** Implementar nueva lógica de negocio, endpoints o corregir bugs

- Ciclo Red-Green-Refactor estricto
- Pirámide de pruebas (Vitest unitarios/integración + Playwright E2E)
- Pruebas obligatorias de límite de confianza y multi-tenancy

---

### 8. **telemetry-and-cost-auditor**
**Cuándo usar:** Modificar el scheduler agéntico, observabilidad y control de costes

- Arquitectura de observabilidad en dos capas (`agent_execution_logs` vs Sentry)
- Contabilidad de tokens e inferencia IA en `aiLedger`
- Trazabilidad y latencia de tareas atómicas del scheduler

---

### 9. **owasp-llm-security-auditor**
**Cuándo usar:** Auditar seguridad, flujos de datos externos y blindaje contra ciberataques

- Mitigación del OWASP Top 10 for LLMs (Inyecciones directas/indirectas, SSRF, XSS)
- Sanitización obligatoria con `sanitizeExternalText` y `esUrlExternaSegura`
- Blindaje criptográfico de stems y propiedad intelectual musical

---

## 🎯 Cómo Usar Skills

### Desde Claude Code
```
/skill agentic-harness
/skill security-multitenancy
/skill fullstack-ux-design
/skill supabase-architect
/skill graphify
/skill llm-evals-benchmark
/skill tdd-regression-guardian
/skill telemetry-and-cost-auditor
/skill owasp-llm-security-auditor
```

### Desde Google AI Studio
Los skills están disponibles en `.gemini/skills/` o en esta carpeta `/skills/`.
Referencia el archivo `SKILL.md` de cada carpeta.

### Desde GitHub Copilot / Open Code
Referencia directa: `/skills/NOMBRE_SKILL/SKILL.md`

---

## 📖 Flujo Típico de Desarrollo

1. **Lee** `AGENTS.md` (raíz del repo) — es la fuente de verdad de instrucciones del proyecto, no este directorio
2. **Identifica** qué área tocas (agentes, seguridad, UX, DB)
3. **Carga el Skill correspondiente** desde aquí
4. **Sigue el checklist** del skill antes de hacer PR
5. **Referencia la sección de ejemplos** del skill para patrones

---

## 🔄 Sincronización Entre Tools

`/skills/` (aquí) es la **fuente única**. Cada herramienta lee una **copia real** (no symlinks: no sobreviven de forma fiable a un build/deploy de Railway):

| Herramienta | Carpeta | Cómo se carga |
|---|---|---|
| Claude Code | `.claude/skills/` | `/skill <nombre>` |
| Google AI Studio (Gemini) | `.gemini/skills/` | lee el directorio |
| Open Code | `.opencode/skills/` | lee el directorio |
| GitHub Copilot y cualquier otro | `skills/` | referencia el path en el prompt |

**Edita siempre `skills/`, nunca una copia**, y sincroniza:

```bash
npm run skills:sync     # copia skills/ a las tres carpetas
```

`npm run verify:docs` (y por tanto el CI) ejecuta `scripts/sync-skills.mjs --check` y falla si alguna copia difiere de la fuente, si falta un skill o si hay uno huérfano. Antes esto era una copia manual y se desvió: faltaban skills en la fuente y `.claude/skills/` no existía.

## 📇 Índice completo (22 skills)

| Skill | Para qué |
|---|---|
| `agent-skills` | Agent Skills specification, schema, and orchestration framework for creating, validating, and sharing interoperable AI agent skills (SKILL.md standard). |
| `agentic-harness` | Guía de arquitectura para los agentes de IA (Booking CRM, Reels, Music Studio) y control del Scheduler en BandManager.io. Usar al modificar agentEngine.ts, lectorAgent.ts |
| `agentic-runtime-telemetry` | Observability, two-layer error tracking (agent_execution_logs vs Sentry), and precise AI token accounting in aiLedger for Claude Code, Open Code, Cursor, and Gemini. |
| `audio-and-media-engine` | Tone.js Web Audio synthesis, MIDI export, audio key/BPM analysis, and Supabase Storage asset hierarchy for BandManager.io. Works across Claude Code, Open Code, Cursor, an |
| `clean-code-discipline` | Reglas de concisión extrema, prevención de sobre-ingeniería (anti-bloat), reutilización de utilidades nativas y existentes de BandManager.io, y cero deuda técnica de Type |
| `code-graph-navigator` | Guía de navegación determinista y mapeo de dependencias de la arquitectura de BandManager.io (frontend React 19, backend Express, agentes IA, capa de persistencia Supabas |
| `cyber-and-trust-guardian` | Universal zero-trust multi-tenant security & OWASP LLM defense skill for Claude Code, Open Code, Cursor, and Gemini. Enforces getTargetBandId, SSRF guard, anti-prompt inj |
| `fullstack-ux-design` | Guía de ingeniería Frontend (React 19, Motion, Tailwind v4) y Backend (Express modular, Vitest) para BandManager.io. Usar al crear componentes UI o refinamientos API. Par |
| `graphify` | Universal AST & Obsidian Knowledge Graph engine for BandManager.io. Works seamlessly with Claude Code, Open Code, Cursor, and Gemini. Enables zero-latency navigation via  |
| `human-in-the-loop-flow` | Human-in-the-loop state protocol, agent execution lifecycle, and dispatch safety rules for BandManager.io. Works across Claude Code, Open Code, Cursor, and Gemini. |
| `llm-evals-benchmark` | Scientific evaluation and benchmarking harness for LLM agents in BandManager.io. Works across Claude Code, Open Code, Cursor, and Gemini to quantify hallucination rate, R |
| `omniroute` | Open-source AI gateway integration, multi-model fallback, quota-aware routing, and unified AI provider orchestration for coding agents and LLM services. |
| `owasp-llm-security-auditor` | Blindaje de ciberseguridad avanzado y auditoría contra los riesgos del OWASP Top 10 for LLMs en BandManager.io. Protege contra inyecciones directas/indirectas, fuga de da |
| `ponytail` | Lazy senior developer mindset. Write less code, use existing solutions, prioritize standard libraries, avoid premature abstractions, and apply the YAGNI decision ladder. |
| `prompt-craft-and-dna` | Advanced prompt engineering, Band DNA injection, anti-AI cliché filters, and Read Aloud score validation for BandManager.io. Works across Claude Code, Open Code, Cursor,  |
| `security-multitenancy` | Guía de auditoría de seguridad y aislamiento multi-inquilino para Express y Supabase en BandManager.io. Usar al modificar rutas de servidor, endpoints API o consultas a b |
| `supabase-architect` | Guía de arquitectura de datos con Supabase PostgreSQL para BandManager.io. Usar al modificar tablas, crear migraciones SQL, definir modelos TypeScript o actualizar handle |
| `supabase-schema-architect` | PostgreSQL database schema migrations, multi-tenant index optimization, idempotency, and RLS security hardening for Supabase in BandManager.io. Works across Claude Code,  |
| `tdd-fast-feedback` | Fast feedback TDD workflow and anti-regression engine for Claude Code, Open Code, Cursor, and Gemini. Uses Vitest and Playwright with <1.5s validation loops. |
| `tdd-regression-guardian` | Marco de Test-Driven Development (TDD) estricto y prevención de regresiones para BandManager.io. Aplica ciclo Red-Green-Refactor con Vitest y Playwright E2E antes de alte |
| `telemetry-and-cost-auditor` | Observabilidad distribuida, auditoría de agentes, seguimiento de errores en dos capas (agent_execution_logs vs Sentry) y contabilidad precisa de tokens/costes en BandMana |
| `visual-identity` | Sistema de identidad visual «Espectro» de BandManager.io — cero bordes, radio escalado, color por módulo, la Onda como lenguaje de datos y los tres temas (Claro/Oscuro/Cl |

---

## 🚀 Agregar Nuevo Skill

1. Crea carpeta: `/skills/NUEVO_SKILL/`
2. Crea archivo: `SKILL.md` con frontmatter YAML:
   ```yaml
   ---
   name: nuevo-skill
   description: Descripción breve (usado por herramientas de IA)
   ---
   ```
3. Estructura: 
   - Sección introductoria
   - Patrones detallados con ejemplos
   - Anti-patterns (qué evitar)
   - Checklist pre-PR
4. Actualiza `context/AGENT_CONTEXT.md` para referenciar el nuevo skill

---

**Para agentes de IA:** Lee primero `AGENTS.md` (raíz), luego ve al skill específico.

**Última actualización:** 2026-09-17
