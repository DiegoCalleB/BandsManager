---
id: server_routes_agent
title: "server/routes/agent.ts"
layer: agent
domain: system
file: "server/routes/agent.ts"
tags: ["agent", "system", "auto"]
---

# 📌 server/routes/agent.ts

> **Ubicación:** `server/routes/agent.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Orquestación de los agentes de booking: disparo manual/cron (`/trigger-agent`), historial de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(Layer: #agent, Domain: #booking)*
- [[agent_lector|Lector Agent (Listener)]] *(Layer: #agent, Domain: #booking)*
- [[agent_scout|Scout Discovery Agent]] *(Layer: #agent, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_leads|server/routes/leads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(Layer: #route, Domain: #booking)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_venueIntelligenceService|server/services/venueIntelligenceService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_agentFunnel|server/utils/agentFunnel.ts]] *(Layer: #agent, Domain: #system)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_scoutLeads|server/utils/scoutLeads.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_spanishFestivalsDB|server/utils/spanishFestivalsDB.ts]] *(Layer: #service, Domain: #system)*
- [[src_constants_regions|src/constants/regions.ts]] *(Layer: #service, Domain: #system)*
- [[src_db_seed|src/db_seed.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_agent_execution_logs|tabla agent_execution_logs]] *(Layer: #schema, Domain: #system)*
- [[tabla_booking_campaigns|tabla booking_campaigns]] *(Layer: #schema, Domain: #booking)*
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_components_booking_venue_modal_VenueEmailThread|src/components/booking/venue_modal/VenueEmailThread.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenuePitchWorkspace|src/components/booking/venue_modal/VenuePitchWorkspace.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueAgentWorkflowBanner|src/components/booking/venue_panel/VenueAgentWorkflowBanner.tsx]] *(from #agent)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(from #agent)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
