---
id: server_services_agentQueueWorker
title: "server/services/agentQueueWorker.ts"
layer: agent
domain: system
file: "server/services/agentQueueWorker.ts"
tags: ["agent", "system", "auto"]
---

# 📌 server/services/agentQueueWorker.ts

> **Ubicación:** `server/services/agentQueueWorker.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Worker Engine para la procesación distribuida de la cola de agentes de IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(Layer: #agent, Domain: #booking)*
- [[agent_lector|Lector Agent (Listener)]] *(Layer: #agent, Domain: #booking)*
- [[agent_scheduler|Agent Scheduler In-Process]] *(Layer: #agent, Domain: #booking)*
- [[server_services_agentQueueService|server/services/agentQueueService.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_campaignRadarScheduler|server/services/campaignRadarScheduler.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
