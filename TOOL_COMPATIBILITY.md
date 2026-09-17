# 🛠️ Tool Compatibility — Agnóstico de Herramienta IA

**BandManager.io está pensado para usarse con cualquier herramienta de IA agéntica:**
- **Claude Code** (claude.ai/code)
- **Google AI Studio** (Gemini)
- **GitHub Copilot** / Open Code u otras

Esta documentación explica cómo el proyecto está estructurado para soportar varias herramientas sin fricción — y, a diferencia de la versión anterior de este archivo, describe lo que hay de verdad en el repo hoy, no un diseño aspiracional.

---

## 📍 Puntos de Entrada por Tool

### Claude Code (claude.ai/code)
1. Abre el repositorio en Claude Code — `CLAUDE.md` (pointer corto) y `AGENTS.md` (reglas completas) se leen al arrancar.
2. Carga un skill si hace falta: `/skill agentic-harness` (u otro, ver `skills/README.md`) — vive en `.claude/skills/`.
3. `.claude/settings.json` trae hooks configurados (ver AGENTS.md §2.2 y §7 para el detalle de qué avisan).

### Google AI Studio (Gemini)
1. Abre el repositorio como proyecto.
2. Lee `AGENTS.md` (reglas) y `skills/README.md` (qué skill usar y cuándo).
3. Los skills están duplicados en `.gemini/skills/` (copia real, no symlink — ver nota de sincronización en `skills/README.md`).

### GitHub Copilot / Open Code
1. Abre el repositorio en el editor.
2. Lee `AGENTS.md` directamente — es agnóstico de herramienta por diseño.
3. Referencia skills con el path directo: `/skills/security-multitenancy/SKILL.md`.

---

## 🗂️ Estructura Real (no aspiracional)

```
BandsManager/
├── AGENTS.md                  ⭐ ÚNICA fuente de verdad de reglas del proyecto
├── CLAUDE.md                  Pointer corto a AGENTS.md (Claude Code lo lee al arrancar)
│
├── skills/                    ⭐ Fuente única de los skills (4: agentic-harness,
│   │                            security-multitenancy, fullstack-ux-design,
│   │                            supabase-architect)
│   └── README.md              Cómo usar skills + política de sincronización de copias
│
├── .claude/
│   ├── skills/                Copia real de /skills/ (no symlink), para `/skill <nombre>`
│   └── settings.json          Hooks (ver AGENTS.md)
│
├── .gemini/
│   └── skills/                Copia real de /skills/, para AI Studio
│
└── ... (código del proyecto)
```

**Nota histórica:** este proyecto tuvo una carpeta `context/` (11 archivos, documentación operativa duplicada de AGENTS.md) que se declaraba a sí misma "single source of truth" en paralelo a AGENTS.md. Se quedó desactualizada en días y las dos fuentes empezaron a contradecirse. Se retiró el 2026-09-17 (recuperable vía `git log -- context/` si hace falta algo puntual para la memoria del TFM). Lección aplicada aquí: **una sola fuente de reglas (`AGENTS.md`), copias explícitas y declaradas como copias para los skills — nunca un segundo documento de reglas "agnóstico" compitiendo con el primero.**

---

## ✅ Checklist Pre-Push (Universal, cualquier tool)

```bash
npx tsc --noEmit     # 0 errores nuevos sobre el baseline de CI
npm run lint:eslint  # deuda existente con ratchet, no crece (AGENTS.md §5.4)
npm test             # suite completa en verde
```

Seguridad (si el diff toca `band_id`/auth/`fetch()` de usuario/uploads/envío de emails de agentes): pasar `/security-review` — ver AGENTS.md §2.2 punto 5 para cuándo es obligatorio.

---

**Última actualización:** 2026-09-17
