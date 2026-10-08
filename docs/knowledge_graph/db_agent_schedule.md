---
id: db_agent_schedule
title: "Estado del Scheduler de agentes"
layer: db
domain: system
file: "server/services/agentScheduler.ts"
tags: ["db", "scheduler"]
---

# 📌 Estado del Scheduler de agentes

> **Ubicación:** `server/services/agentScheduler.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla agent_schedule_state: cuándo toca cada agente (Scout, Lector) y su último resultado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_scheduler|Agent Scheduler In-Process]] *(Layer: #agent, Domain: #booking)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
