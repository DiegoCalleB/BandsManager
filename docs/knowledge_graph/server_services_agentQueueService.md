---
id: server_services_agentQueueService
title: "server/services/agentQueueService.ts"
layer: agent
domain: system
file: "server/services/agentQueueService.ts"
tags: ["agent", "system", "auto"]
---

# 📌 server/services/agentQueueService.ts

> **Ubicación:** `server/services/agentQueueService.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Servicio de Cola de Tareas Distribuidas y Resilientes para Agentes de IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_agent_jobs_queue|tabla agent_jobs_queue]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[server_routes_agentQueue|server/routes/agentQueue.ts]] *(from #agent)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/agentQueueRecuperacion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
