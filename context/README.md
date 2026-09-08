# 📚 Context Folder - BandManager.ai Knowledge Base

Este folder contiene toda la documentación estructurada del proyecto, organizada para agentes, skills, developers y cualquiera que necesite contexto.

### 🎯 Multi-Tool Setup

Si usas **Claude Code, AI Studio, Copilot u otra herramienta IA**, lee primero [`TOOL_COMPATIBILITY.md`](../TOOL_COMPATIBILITY.md) (en root). Explica cómo el proyecto funciona agnóstico de herramienta y dónde están los skills.

---

## 🎯 ¿Dónde Empezar?

### Para Agentes & Skills (Primero Esto)

1. **→ `AGENT_CONTEXT.md`** (5 min) — Resumen ejecutivo. "Lo que todo agente debe saber."
   - En 60 segundos: qué es BandManager.ai, stack, archivos clave
   - Checklist pre-push
   - Tareas comunes con links a archivos relevantes

2. **→ `PROJECT_OVERVIEW.md`** (10 min) — Visión general del proyecto
   - ¿Qué es? ¿Para qué sirve?
   - Stack técnico resumido
   - Estado actual, valores clave

3. **→ `GLOSSARY.md`** (referencia) — Glosario de términos clave
   - Acrónimos (JWT, OAuth, SSRF, etc.)
   - Definiciones (lead, pitch, dispatch mode, etc.)
   - Estados frecuentes
   - Funciones críticas

### Si Necesitas Profundizar

4. **→ `ARCHITECTURE.md`** (20 min) — Arquitectura técnica completa
   - Runtime dual (frontend + backend en 1 deploy)
   - Data layer (Supabase)
   - Flujo de datos
   - Stack de autenticación
   - Deploy (Railway)

5. **→ `SECURITY.md`** (20 min) — Seguridad & Multi-tenancy
   - Trust boundary (`getTargetBandId()`)
   - Capa de datos (confianza cero)
   - SSRF guard
   - Rate limiting
   - Aprobación humana obligatoria

6. **→ `BUSINESS_RULES.md`** (30 min) — Reglas de negocio de Agentes IA
   - Máquina de estados (2D: CRM × Agentic)
   - 4 Agentes (Scout, Redactor, Enviador, Lector)
   - Ciclo de vida completo
   - Gates de seguridad
   - Auditoría & logs

7. **→ `CODE_STANDARDS.md`** (15 min) — Estándares de código
   - TypeScript strict
   - Backend: Express, async/await, rate limiting
   - Frontend: React 19, hooks, validación
   - Testing (Vitest)
   - Commits & PRs

8. **→ `UI_UX_GUIDELINES.md`** (15 min) — Diseño & interfaz
   - Content first (primaria arriba)
   - Responsive (distinct layouts, no flex-wrap)
   - Dark mode
   - Acciones: max 3 permanentes, resto en menú

---

## 📂 Estructura de Archivos

```
context/
├── README.md                      ← Estás aquí
├── AGENT_CONTEXT.md               ← LEER PRIMERO (agentes)
├── SIMPLICITY_FIRST.md ⭐         ← La obsesión: cero fricción UX
├── PROJECT_OVERVIEW.md            ← Qué es el proyecto
├── ARCHITECTURE.md                ← Cómo funciona (tech)
├── DATABASE_SCHEMA.md             ← Estructura de Supabase (tablas, relaciones)
├── SECURITY.md                    ← Seguridad & multi-tenancy (CRÍTICO)
├── BUSINESS_RULES.md              ← Reglas de negocio de agentes IA
├── TESTING_STRATEGY.md 🧪         ← Qué testear, cómo, checklist pre-PR
├── CODE_STANDARDS.md              ← Estándares de código
├── UI_UX_GUIDELINES.md            ← Diseño & frontend
└── GLOSSARY.md                    ← Términos clave (referencia)
```

---

## 🚀 Flujos de Trabajo Comunes

### "Voy a agregar una ruta de backend"

1. Lee: `AGENT_CONTEXT.md` (quick check)
2. Lee: `SECURITY.md` #1-2 (trust boundary, DB layer)
3. Lee: `CODE_STANDARDS.md` #2 (Express patterns)
4. Implementa con `getTargetBandId()` + `requireAuth` + try/catch
5. Test: `CODE_STANDARDS.md` #4 (Vitest pattern)

### "Voy a mejorar la interfaz"

1. Lee: `AGENT_CONTEXT.md` (quick check)
2. Lee: `UI_UX_GUIDELINES.md` (content first, responsive, dark mode)
3. Implementa con React 19 hooks
4. Testea en móvil (~390px width)
5. Probá dark mode antes de merge

### "Voy a tocar los agentes IA"

1. Lee: `AGENT_CONTEXT.md` (quick check)
2. Lee: `BUSINESS_RULES.md` (máquina de estados, 4 agentes)
3. Lee: `SECURITY.md` #9 (aprobación humana)
4. Implementa respetando human-in-the-loop
5. Log en `lead_audit_log` para cada transición

### "¿Por qué no funciona X?"

1. Grep en repo: `grep -r "X" src/ server/`
2. Lee: `GLOSSARY.md` para entender términos
3. Lee: `ARCHITECTURE.md` para entender flujo
4. Lee: `SECURITY.md` si es problema de cross-tenant

---

## 🔍 Búsquedas Rápidas

| Pregunta | Lee |
|----------|-----|
| "¿La app es demasiado compleja?" | `SIMPLICITY_FIRST.md` (3-second test, checklist) |
| "¿Dónde clickeo?" | `SIMPLICITY_FIRST.md` (content-first, 3 botones max) |
| "¿Qué tablas hay en la BD?" | `DATABASE_SCHEMA.md` (ER diagram + todas las tablas) |
| "¿Estructura de la BD?" | `DATABASE_SCHEMA.md` + `ARCHITECTURE.md` #2 |
| "¿Cómo autenticar una ruta?" | `CODE_STANDARDS.md` #2 + `SECURITY.md` #5 |
| "¿Cómo proteger contra SSRF?" | `SECURITY.md` #4 |
| "¿Estados de un lead?" | `BUSINESS_RULES.md` #2 + `GLOSSARY.md` |
| "¿Cómo arreglamos multi-tenancy?" | `SECURITY.md` #1-2 |
| "¿UI design principles?" | `UI_UX_GUIDELINES.md` + `SIMPLICITY_FIRST.md` |
| "¿Qué testear?" | `TESTING_STRATEGY.md` (qué sí, qué no, checklist) |
| "¿Cómo testear?" | `TESTING_STRATEGY.md` + `CODE_STANDARDS.md` #4 |
| "¿Qué es EPK?" | `GLOSSARY.md` |
| "¿Env vars?" | `GLOSSARY.md` (Env Vars Clave) |

---

## 📋 Checklist Pre-Push (Resumen)

De `AGENT_CONTEXT.md`:

- [ ] `npm run tsc --noEmit` → 0 errores TypeScript nuevo
- [ ] `npm run lint` → pasa (esbuild can bundle)
- [ ] `npm test` → tests verdes
- [ ] Multi-tenancy: ¿usé `getTargetBandId(req)`?
- [ ] Async handlers: ¿tienen try/catch?
- [ ] IA endpoints: ¿`requireAuth` + `iaRateLimiter`?
- [ ] Fetch externo: ¿`esUrlExternaSegura(url)`?
- [ ] Commit message: explica el POR QUÉ
- [ ] Diff es quirúrgico (no refactores acoplados)

---

## 🎓 Para Desarrolladores Nuevos

### Lectura Inicial Recomendada (3 horas)

1. `PROJECT_OVERVIEW.md` (10 min)
2. `AGENT_CONTEXT.md` (20 min)
3. `SIMPLICITY_FIRST.md` ⭐ (15 min) — **Tu obsesión central**
4. `ARCHITECTURE.md` (30 min)
5. `DATABASE_SCHEMA.md` (20 min)
6. `SECURITY.md` (20 min)
7. `BUSINESS_RULES.md` (20 min)
8. `TESTING_STRATEGY.md` (20 min) — **Lo que testear (crítico)**
9. `CODE_STANDARDS.md` (15 min)

Después: Explorar código en `server/` y `src/`, siguiendo patrones en estos documentos.

### Por Tipo de Tarea

- **UX/Simplicity (TÚ):** SIMPLICITY_FIRST (obsesión central)
- **Backend:** DATABASE_SCHEMA + ARCHITECTURE + SECURITY + CODE_STANDARDS + TESTING_STRATEGY
- **Frontend:** SIMPLICITY_FIRST + UI_UX_GUIDELINES + CODE_STANDARDS + TESTING_STRATEGY
- **Agentes IA:** BUSINESS_RULES + SECURITY + DATABASE_SCHEMA + TESTING_STRATEGY
- **Testing (CRÍTICO):** TESTING_STRATEGY (antes de toda PR)
- **Deploy/DevOps:** ARCHITECTURE (sección Deploy)
- **Setup local:** TESTING_STRATEGY (cómo correr tests)

---

## 🔗 Referencias Externas en Código

- **CLAUDE.md** (`/home/user/BandsManager/CLAUDE.md`) — Comandos, estructura, testing, seguridad (supercedido por `context/` pero sigue siendo referencia oficial)
- **AGENTS.md** (`/home/user/BandsManager/AGENTS.md`) — Directivas del agente de código, no tocar sin razón

---

## 🤖 Para Skills & Custom Agents

Si estás escribiendo un custom agent o skill para BandManager:

1. Empieza con `AGENT_CONTEXT.md` + `GLOSSARY.md`
2. Según tu tarea:
   - **Data access:** Lee `SECURITY.md` #2 (DB layer trust)
   - **API creation:** Lee `CODE_STANDARDS.md` #2 (Backend patterns)
   - **UI updates:** Lee `UI_UX_GUIDELINES.md`
   - **Agentes IA:** Lee `BUSINESS_RULES.md` (máquina de estados)
3. Usa `ARCHITECTURE.md` como referencia de estructura
4. Consulta `GLOSSARY.md` si hay término que no entiendas

---

## 🎯 Filosofía de Esta Documentación

- **Modular:** Cada archivo es independiente (puedes leer solo lo que necesitas)
- **Escalada:** `AGENT_CONTEXT.md` → `PROJECT_OVERVIEW.md` → temas específicos
- **Actualizable:** Cuando cambien reglas, actualiza el archivo correspondiente
- **Versionable:** Vive en git, así agentes de futuro tienen contexto histórico
- **Agente-friendly:** Estructurada para ser parseada por IA + humanos

---

## 📝 Notas para Mantenedores

- Cuando agregues nueva regla de seguridad: actualiza `SECURITY.md`
- Cuando cambies máquina de estados: actualiza `BUSINESS_RULES.md`
- Cuando agregues nuevo env var: actualiza `GLOSSARY.md` + `ARCHITECTURE.md`
- Cuando agregues patrón de código: actualiza `CODE_STANDARDS.md`
- Cuando cambies UI pattern: actualiza `UI_UX_GUIDELINES.md`

---

## ❓ FAQ

**P: ¿Debo leer TODO antes de tocar código?**
R: No. Lee `AGENT_CONTEXT.md` + archivo específico de tu tarea.

**P: ¿Y si necesito referencia rápida?**
R: `GLOSSARY.md` + `AGENT_CONTEXT.md` (una página cada una).

**P: ¿Estos documentos reemplazan CLAUDE.md / AGENTS.md?**
R: No, son complementarios. `context/` es modular + actualizable; CLAUDE.md/AGENTS.md son el source of truth pero muy largos.

**P: ¿Qué pasa si documentación y código se desalinean?**
R: El código es la verdad. La documentación es la guía. Sube issue si encuentras desalineación.

---

## 🚀 Próximos Pasos

1. **Léete `AGENT_CONTEXT.md` ahora** (5 min)
2. **Levanta el proyecto:** `npm install && npm run dev`
3. **Explora código:** Empieza por `server/utils/bandAccess.ts` (encarna los principios clave)
4. **Haz un cambio:** Una ruta nueva, un test, un componente UI
5. **Valida con checklist:** Pre-push checklist en AGENT_CONTEXT.md

---

**¿Listo? → Empieza con `AGENT_CONTEXT.md`**

