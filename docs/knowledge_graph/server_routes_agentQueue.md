---
id: server_routes_agentQueue
title: "server/routes/agentQueue.ts"
layer: agent
domain: system
file: "server/routes/agentQueue.ts"
tags: ["agent", "system", "auto"]
---

# 📌 server/routes/agentQueue.ts

> **Ubicación:** `server/routes/agentQueue.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Cola de trabajos de los agentes (`agent_jobs_queue`): estadísticas, métricas, purga y encolado

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_services_agentQueueService|server/services/agentQueueService.ts]] *(Layer: #agent, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[src_components_booking_AgentQueueMonitorModal|src/components/booking/AgentQueueMonitorModal.tsx]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
