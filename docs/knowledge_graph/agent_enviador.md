---
id: agent_enviador
title: "Enviador Agent (Dispatcher)"
layer: agent
domain: booking
file: "server/services/agentEngine.ts"
tags: ["agent", "dispatcher", "human-in-the-loop"]
---

# 📌 Enviador Agent (Dispatcher)

> **Ubicación:** `server/services/agentEngine.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Despacha correos únicamente tras aprobación humana (aprobado_propuesta/respuesta).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_email|server/utils/email.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_emailTemplate|server/utils/emailTemplate.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_agent_execution_logs|tabla agent_execution_logs]] *(Layer: #schema, Domain: #system)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/agentEngine.test.ts`
- `server/services/__tests__/agentEngineDirectSend.test.ts`
- `server/services/__tests__/agentEngineSeguridad.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
