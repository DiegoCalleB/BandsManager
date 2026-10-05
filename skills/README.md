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
- Scheduler operation (60s tick)
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
- Trazabilidad y latencia de tareas atómicas del scheduler de 60s

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

`/skills/` (aquí) es la fuente única. `.claude/skills/` y `.gemini/skills/` son **copias reales** (no symlinks — un symlink no sobrevive de forma fiable un build/deploy de Railway), una por herramienta:
- **Claude Code** → lee desde `.claude/skills/` (copia real, se carga con `/skill <nombre>`)
- **Google AI Studio** → lee desde `.gemini/skills/` (copia real)
- **GitHub Copilot** → referencia directa a `/skills/` (sin copia propia, referencia el path en el prompt)

**Importante — esto es una copia manual, no automática:** si editas un `SKILL.md`, cópialo también a `.claude/skills/<nombre>/` y `.gemini/skills/<nombre>/` en el mismo commit. No hay tooling que lo sincronice solo todavía — es la misma trampa de deriva que tuvo `context/` (retirado; ver `git log -- context/` si hace falta recuperar algo de esa carpeta), así que no dejes que las copias se desincronicen del original.

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
