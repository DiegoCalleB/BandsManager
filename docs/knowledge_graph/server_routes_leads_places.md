---
id: server_routes_leads_places
title: "server/routes/leads/places.ts"
layer: route
domain: booking
file: "server/routes/leads/places.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/places.ts

> **Ubicación:** `server/routes/leads/places.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Descubrimiento de salas/festivales: búsqueda en Places, campañas masivas, extracción de emails,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_leads_helpers|server/routes/leads/helpers.ts]] *(Layer: #route, Domain: #booking)*
- [[server_services_multiSourceVenueDiscoveryService|server/services/multiSourceVenueDiscoveryService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_publicCulturalEventsRadarService|server/services/publicCulturalEventsRadarService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_similarBandsVenueMatcherService|server/services/similarBandsVenueMatcherService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_venueIntelligenceService|server/services/venueIntelligenceService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
