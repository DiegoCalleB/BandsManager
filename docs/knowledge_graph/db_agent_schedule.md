---
id: db_agent_schedule
title: "Estado del Scheduler de agentes"
layer: db
domain: system
file: "server/db/agentSchedule.ts"
tags: ["db", "scheduler"]
---

# 📌 Estado del Scheduler de agentes

> **Ubicación:** `server/db/agentSchedule.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla agent_schedule_state: cuándo toca cada agente (Scout, Lector) y su último resultado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_scheduler|Agent Scheduler In-Process]] *(Layer: #agent, Domain: #booking)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_agent_schedule_state|tabla agent_schedule_state]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[server_db|server/db.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
