---
id: agent_lector
title: "Lector Agent (Listener)"
layer: agent
domain: booking
file: "server/services/lectorAgent.ts"
tags: ["agent", "listener", "gmail-oauth"]
---

# 📌 Lector Agent (Listener)

> **Ubicación:** `server/services/lectorAgent.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Monitoriza respuestas entrantes de salas vía Gmail OAuth2 / IMAP según el scheduler (ver ADR 0007).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(Layer: #agent, Domain: #booking)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_sentimentAnalysis|server/services/sentimentAnalysis.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_email|server/utils/email.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_emailDeliveryTracker|server/utils/emailDeliveryTracker.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_leadLanguage|server/utils/leadLanguage.ts]] *(Layer: #service, Domain: #booking)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(from #security)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/lectorAgent.test.ts`
- `server/services/__tests__/lectorAgentOrder.test.ts`
- `server/services/__tests__/lectorClassification.test.ts`
- `server/services/__tests__/lectorMultiVectorMatching.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
