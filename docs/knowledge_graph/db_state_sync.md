---
id: db_state_sync
title: "In-Memory State & Supabase Sync"
layer: db
domain: system
file: "server/state.ts"
tags: ["database", "memory", "sync"]
---

# 📌 In-Memory State & Supabase Sync

> **Ubicación:** `server/state.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Copia en memoria de alta velocidad sincronizada con Supabase al arranque.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_slug|server/utils/slug.ts]] *(Layer: #service, Domain: #system)*
- [[src_db_seed|src/db_seed.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[hook_app_data|useAppData Hook]] *(from #hook)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server|server.ts]] *(from #route)*
- [[server_controllers_tours_controller|server/controllers/tours.controller.ts]] *(from #service)*
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_agentQueue|server/routes/agentQueue.ts]] *(from #agent)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_bands_responseStrategies|server/routes/bands/responseStrategies.ts]] *(from #route)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_routes_leads_emailValidation|server/routes/leads/emailValidation.ts]] *(from #route)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(from #route)*
- [[server_routes_leads_import|server/routes/leads/import.ts]] *(from #route)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(from #route)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(from #route)*
- [[server_routes_posts|server/routes/posts.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_routes_spotify|server/routes/spotify.ts]] *(from #route)*
- [[server_routes_tours|server/routes/tours.ts]] *(from #route)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*
- [[server_routes_transposeRoute|server/routes/transposeRoute.ts]] *(from #route)*
- [[server_routes_upload|server/routes/upload.ts]] *(from #route)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(from #agent)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
