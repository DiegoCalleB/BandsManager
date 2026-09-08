# 🛠️ Tool Compatibility - Agnóstico de Herramienta IA

**BandManager.ai está optimizado para usarse con CUALQUIER herramienta de IA:**
- **Claude Code** (Claude.ai)
- **Google AI Studio** (Gemini)
- **GitHub Copilot** (Codex)
- **Open Code** o similar

Esta documentación explica cómo el proyecto está estructurado para soportar todas las herramientas sin fricción.

---

## 📍 Puntos de Entrada por Tool

### Claude Code (claude.ai/code)
1. Abre el repositorio en Claude Code
2. Lee `context/AGENT_CONTEXT.md` (5 min)
3. Carga un skill si es necesario: `/skill agentic-harness` (u otro)
4. Uso: comandos `/` disponibles (run, test, lint, etc.)

**Config:** `.claude/settings.json` (si existe, auto-detecta permisos)

---

### Google AI Studio (Gemini en Google AI Studio)
1. Abre el repositorio como proyecto
2. Lee `skills/README.md` (ubicación agnóstica)
3. Los skills en `/skills/` son accesibles desde el prompt
4. Uso: referencias directas a archivos, no comandos `/`

**Config:** `.gemini/skills/` (symlink a `/skills/` o copia)

---

### GitHub Copilot / Open Code
1. Abre el repositorio en el editor (VS Code, JetBrains, etc.)
2. Lee `AGENTS.md` + `context/AGENT_CONTEXT.md`
3. Skills en `/skills/` – referencia en prompts
4. Uso: Chat natural, sin comandos especiales

**Config:** `.copilot/settings.json` (si existe)

---

## 🗂️ Estructura Agnóstica

```
BandsManager/
├── skills/                    ⭐ Single Source of Truth
│   ├── agentic-harness/SKILL.md
│   ├── security-multitenancy/SKILL.md
│   ├── fullstack-ux-design/SKILL.md
│   ├── supabase-architect/SKILL.md
│   └── README.md              ← Cómo usar skills
│
├── context/                   ⭐ Central Documentation (agnóstico)
│   ├── AGENT_CONTEXT.md       ← 5-min quick reference (todo agente empieza aquí)
│   ├── README.md              ← Navigation guide
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── SECURITY.md
│   ├── BUSINESS_RULES.md
│   ├── CODE_STANDARDS.md
│   ├── UI_UX_GUIDELINES.md
│   ├── SIMPLICITY_FIRST.md
│   ├── TESTING_STRATEGY.md
│   └── GLOSSARY.md
│
├── AGENTS.md                  ⭐ Project Rules (agnóstico)
│   └─ Instrucciones no específicas de tool
│
├── CLAUDE.md                  (Referencia histórica, superseeded by context/)
│
├── .claude/                   (Claude Code specific)
│   └─ settings.json (si se crea)
│
├── .gemini/                   (Google AI Studio specific)
│   └─ skills/ → symlink a ../skills/
│
├── .copilot/                  (Copilot specific, si se usa)
│   └─ settings.json (si se crea)
│
└── ... (código del proyecto)
```

**Key Principle:** `/context/` y `/skills/` son **agnósticos**. Herramientas específicas (`.claude/`, `.gemini/`, `.copilot/`) pueden ser symlinks o configs de integración, nunca fuente de verdad.

---

## 🎯 Flujo Universal para Cualquier Agente

1. **Primero:** Lee `context/AGENT_CONTEXT.md` (60 segundos, overview)
2. **Luego:** Identifica qué área tocas (agentes, seguridad, UX, DB)
3. **Carga:** Skill correspondiente desde `/skills/NOMBRE/SKILL.md`
4. **Sigue:** Checklist del skill antes de hacer cambios
5. **Test:** Validaciones de CI (`npm run tsc --noEmit`, `npm run lint`, `npm test`)
6. **Commit:** Mensaje explica el POR QUÉ (no solo QUÉ)

---

## 📋 Checklists Pre-Push (Universal)

Estos aplican en **todas las herramientas**:

```bash
# TypeScript: 0 new errors (baseline en CI es 0)
npm run tsc --noEmit

# Linting: esbuild can still bundle
npm run lint

# Testing: all tests green
npm test

# Security review (si cambias backend/DB/auth)
- ¿Usé getTargetBandId(req)?
- ¿Validé bandId en todas las funciones DB?
- ¿Endpoints de IA tienen requireAuth + iaRateLimiter?

# Commit message
git commit -m "feat/fix/docs: breve descripción"
# Explica el POR QUÉ, no solo QUÉ (el diff ya dice qué cambió)
```

---

## 🔄 Diferencias Entre Tools

| Aspecto | Claude Code | AI Studio | Copilot |
|---------|------------|-----------|---------|
| **Entry Point** | `/skill` comando | `skills/README.md` directo | `AGENTS.md` + context/ |
| **Commands** | `/run`, `/test`, `/code-review` | No (refs directas) | No (chat natural) |
| **Config** | `.claude/settings.json` | `.gemini/skills/` | `.copilot/settings.json` |
| **Auth Pattern** | Permiso prompt → allow/deny | Direct read (user managed) | Editor permissions |
| **Skills Access** | `/skill NOMBRE` | Read `/skills/NOMBRE/SKILL.md` | Reference path in prompt |
| **Best For** | Complex multi-step refactors | Quick lookups, research | Interactive coding |

---

## 🚀 Setup por Tool (Primera Vez)

### Claude Code
```bash
# Solo leer — no necesita setup especial
# Los skills están en /skills/NOMBRE/SKILL.md
```

### Google AI Studio
```bash
# Si deseas configuración específica:
# 1. Crea .gemini/settings.json
# 2. O mantén referencias a /skills/ directas
```

### Copilot
```bash
# Si deseas configuración específica:
# 1. Crea .copilot/settings.json
# 2. Referencias directas: "Lee /skills/security-multitenancy/SKILL.md"
```

---

## 🎸 Principios de Diseño

1. **Single Source of Truth:** `/skills/` y `context/` son agnósticos
2. **No Duplication:** `.gemini/` y `.claude/` NO duplican contenido, solo integran
3. **Autodescubrimiento:** Cualquier tool lee README.md o AGENT_CONTEXT.md y sabe qué hacer
4. **Escalabilidad:** Agregar nueva tool = crear `.TOOLNAME/settings.json`, listo

---

## 📚 Documentación Por Role

### Si Eres Agente de Código (Cualquier Tool)
Empieza: `context/AGENT_CONTEXT.md` → Skill correspondiente

### Si Eres Desarrollador Humano
Empieza: `context/README.md` → Tema específico

### Si Eres Gestor / Propietario de Producto
Empieza: `context/PROJECT_OVERVIEW.md` → `context/SIMPLICITY_FIRST.md`

---

## 🔗 Rápidas

- **Skills location:** `/skills/SKILL_NAME/SKILL.md`
- **Quick ref (agents):** `context/AGENT_CONTEXT.md`
- **Full rules:** `AGENTS.md` (agnóstico) + `context/` (temas)
- **Code ref:** `CLAUDE.md` (solo para Claude Code)

---

**Última actualización:** 2026-09-08

**Objetivo:** BandManager funciona igual en Claude Code, AI Studio, Copilot y cualquier tool con IA. Cero configuración específica para empezar.
