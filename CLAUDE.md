# Claude Code — punto de entrada

Las instrucciones del proyecto viven en **[AGENTS.md](./AGENTS.md)** (raíz del repo) — léelo antes de tocar nada, tiene precedencia sobre convenciones genéricas.

Skills especializados disponibles vía `/skill <nombre>`: **todos los de `/skills/`** están ahora espejados en `.claude/skills/` (antes solo 5 lo estaban) — incluye `agentic-harness`, `security-multitenancy`, `visual-identity`, `fullstack-ux-design`, `supabase-architect`, `graphify` (grafo de conocimiento Obsidian/AST, ver `docs/knowledge_graph/`), `code-graph-navigator`, `tdd-fast-feedback`, `tdd-regression-guardian`, `cyber-and-trust-guardian`, `owasp-llm-security-auditor`, `clean-code-discipline`, `ponytail` y el resto — ver `skills/README.md` para cuándo usar cada uno.

Este archivo se mantiene deliberadamente corto: la última vez que este proyecto tuvo documentación operativa duplicada en dos sitios (`AGENTS.md` y `context/`), una se quedó desactualizada sin que nadie se enterara. No añadas reglas aquí — van en AGENTS.md.

**Si vas a tocar UI, carga `visual-identity` antes de escribir un solo `className`.** Es la autoridad estética del repo y tiene precedencia sobre cualquier otra guía, brand book incluido.
