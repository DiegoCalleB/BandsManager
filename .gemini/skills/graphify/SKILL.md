---
name: graphify
description: Universal AST & Obsidian Knowledge Graph engine for BandManager.io. Works seamlessly with Claude Code, Open Code, Cursor, and Gemini. Enables zero-latency navigation via [[Wikilinks]] and deterministic dependency mapping.
---

# 🕸️ Skill: Graphify & Obsidian Knowledge Graph (Universal Agent Standard)

Esta skill permite a **cualquier agente (Claude Code, Open Code, Cursor, Gemini)** navegar por la arquitectura del proyecto a la velocidad de la luz mediante un **Grafo de Conocimiento nativo en Markdown** interconectado por **Wikilinks bidireccionales (`[[...]]`)**.

---

## 🧭 1. Grafo de Conocimiento Nativo (`docs/knowledge_graph/`)

- Todos los componentes UI, hooks, rutas API, guardias de seguridad, agentes y tablas de Supabase están indexados en `docs/knowledge_graph/*.md`.
- Compatible al 100% con **Obsidian Graph View (2D/3D)** y cualquier visor Markdown estándar.

---

## ⚡ 2. Protocolo de Navegación Rápida para Agentes

Cuando se solicite modificar o auditar una funcionalidad:

1. **Localizar el Nodo:** Consultar `docs/knowledge_graph/{node_id}.md` para ver el contrato exacto y sus dependencias.
2. **Seguir las Conexiones (`[[...]]`):** Saltar directamente a los archivos conectados sin escaneos ciegos ni búsquedas recursivas.
3. **Sincronización:** Si se añaden nuevas rutas o componentes, ejecutar:
   ```bash
   npm run graph:sync
   ```

---

## 🛠️ Comandos Universales

- `npm run graph:sync` ➔ Regenera el grafo de Obsidian desde el AST de TypeScript.
- `npm run check:fast` ➔ Validación rápida de tipos y tests de seguridad en <1.5s.
