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
Bucle in-process (60s tick) que orquesta el Scout, Enviador y Lector.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(Layer: #agent, Domain: #booking)*
- [[agent_lector|Lector Agent (Listener)]] *(Layer: #agent, Domain: #booking)*
- [[db_agent_schedule]]

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
