---
id: fn_agentes_correo
title: "Agentes de correo"
layer: feature
domain: booking
file: "server/routes/agent.ts"
tags: ["feature", "booking", "auto"]
---

# 📌 Agentes de correo

> **Ubicación:** `server/routes/agent.ts`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/booking`

## 📖 Descripción
Scheduler, lector (Gmail/IMAP) y enviador con humano en el bucle.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(Layer: #agent, Domain: #booking)*
- [[agent_lector|Lector Agent (Listener)]] *(Layer: #agent, Domain: #booking)*
- [[agent_scheduler|Agent Scheduler In-Process]] *(Layer: #agent, Domain: #booking)*
- [[db_agent_schedule|Estado del Scheduler de agentes]] *(Layer: #db, Domain: #system)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[ext_correo_smtp_imap|Correo SMTP / IMAP]] *(Layer: #external, Domain: #system)*
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[ext_google_oauth_gmail|Google OAuth / Gmail API]] *(Layer: #external, Domain: #system)*
- [[ext_replicate|Replicate]] *(Layer: #external, Domain: #system)*
- [[ext_spotify|Spotify]] *(Layer: #external, Domain: #system)*
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_emailAccounts|server/db/emailAccounts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(Layer: #db, Domain: #booking)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_routes_leads|server/routes/leads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_emailValidation|server/routes/leads/emailValidation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_feedback|server/routes/leads/feedback.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_helpers|server/routes/leads/helpers.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_import|server/routes/leads/import.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_agent_execution_logs|tabla agent_execution_logs]] *(Layer: #schema, Domain: #system)*
- [[tabla_agent_jobs_queue|tabla agent_jobs_queue]] *(Layer: #schema, Domain: #system)*
- [[tabla_booking_campaigns|tabla booking_campaigns]] *(Layer: #schema, Domain: #booking)*
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*
- [[tabla_epk_configs|tabla epk_configs]] *(Layer: #schema, Domain: #epk)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_pitch_vector_store|tabla pitch_vector_store]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_stem_prediction_jobs|tabla stem_prediction_jobs]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
