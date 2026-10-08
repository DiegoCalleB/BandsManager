---
name: agent-skills
description: Agent Skills specification, schema, and orchestration framework for creating, validating, and sharing interoperable AI agent skills (SKILL.md standard).
---

# 🧩 Agent Skills Specification & Ecosystem

Universal framework and open standard for extensible, context-efficient AI Agent Skills.

---

## 📜 1. Estructura Estándar de una Agent Skill (`SKILL.md`)

Cada skill debe ubicarse en su propia carpeta `skills/{id}/SKILL.md` y cumplir con el formato:

```markdown
---
name: nombre-de-la-skill
description: Resumen en 1 o 2 oraciones de cuándo y cómo debe invocarse la skill.
---

# 📌 Título de la Skill

Contexto, objetivos y alcance de la skill.

## 🛠️ Patrones y Reglas
Instrucciones ejecutables, árboles de decisión, código de ejemplo.

## 🚫 Anti-Patrones
Qué evitar estrictamente.

## ✅ Checklist de Validación
Criterios de verificación antes de dar por completada la tarea.
```

---

## 📂 2. Árbol de Skills del Proyecto

```
skills/
├── agentic-harness/        # Flujos agénticos CRM y scheduler
├── security-multitenancy/  # Trust boundary, RLS y aislamiento de datos
├── fullstack-ux-design/    # UI React 19, Motion, Tailwind v4
├── supabase-architect/     # PostgreSQL, migraciones, schema
├── ponytail/               # Minimalismo, YAGNI, cero sobre-ingeniería
├── graphify/               # Mapeo AST determinista del grafo de código
├── omniroute/              # Multi-proveedor de IA y fallback de cuotas
└── agent-skills/           # Esta especificación de interoperabilidad
```

---

## 🚀 3. Principios de Interoperabilidad Multi-Plataforma

- **Agnóstico de herramienta:** Funciona de manera idéntica en Google AI Studio (Gemini), Claude Code, Cursor, Codex y GitHub Copilot.
- **Eficiencia de tokens:** El agente lee el `SKILL.md` solo cuando la tarea coincide con el dominio específico.
- **Sincronización:** Mantener sincronizadas las carpetas `.gemini/skills/` y `skills/`.

---

## ✅ Checklist de Creación de Skills

- [ ] ¿El frontmatter YAML contiene `name` y `description` válidos?
- [ ] ¿Las instrucciones son específicas y aplicables directamente al código?
- [ ] ¿Incluye ejemplos positivos, anti-patrones y un checklist final?
