---
id: server_db
title: "server/db.ts"
layer: db
domain: system
file: "server/db.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db.ts

> **Ubicación:** `server/db.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Módulo sin exportaciones con nombre.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_agent_schedule|Estado del Scheduler de agentes]] *(Layer: #db, Domain: #system)*
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(Layer: #db, Domain: #finances)*
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_contacts|server/db/contacts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_deals|server/db/deals.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_emailAccounts|server/db/emailAccounts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_enlacesCortos|server/db/enlacesCortos.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_db_exampleThreads|server/db/exampleThreads.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_fans|server/db/fans.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_gmailOAuth|server/db/gmailOAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(Layer: #db, Domain: #booking)*
- [[server_db_production|server/db/production.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_reelAnalyses|server/db/reelAnalyses.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_referidos|server/db/referidos.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_schedule|server/db/schedule.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_social|server/db/social.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tours|server/db/tours.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_users|server/db/users.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_webhooks|server/db/webhooks.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_controllers_tours_controller|server/controllers/tours.controller.ts]] *(from #service)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_leads_import|server/routes/leads/import.ts]] *(from #route)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(from #route)*
- [[server_routes_posts|server/routes/posts.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(from #agent)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*
- [[server_services_campaignRadarScheduler|server/services/campaignRadarScheduler.ts]] *(from #service)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(from #service)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*
- [[server_services_socialRadarService|server/services/socialRadarService.ts]] *(from #service)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(from #service)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
