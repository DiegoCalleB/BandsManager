---
id: agent_scheduler
title: "Agent Scheduler In-Process"
layer: agent
domain: booking
file: "server/services/agentScheduler.ts"
tags: ["agent", "scheduler", "cron"]
---

# 📌 Agent Scheduler In-Process

> **Ubicación:** `server/services/agentScheduler.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Bucle in-process (tick de 24 h por defecto, AGENT_SCHEDULER_INTERVAL_MS) que orquesta el Scout, Enviador y Lector.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(Layer: #agent, Domain: #booking)*
- [[agent_lector|Lector Agent (Listener)]] *(Layer: #agent, Domain: #booking)*
- [[db_agent_schedule|Estado del Scheduler de agentes]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_agent_schedule|Estado del Scheduler de agentes]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
