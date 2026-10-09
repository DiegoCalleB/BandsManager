---
id: route_leads_enrichment
title: "Ruta de enriquecimiento de salas"
layer: route
domain: booking
file: "server/routes/leads/enrichment.ts"
tags: ["route", "booking", "enrichment"]
---

# 📌 Ruta de enriquecimiento de salas

> **Ubicación:** `server/routes/leads/enrichment.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Busca datos públicos de una sala (web, redes) para completar su ficha. Pasa por protección SSRF.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_scout|Scout Discovery Agent]] *(Layer: #agent, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_leads_helpers|server/routes/leads/helpers.ts]] *(Layer: #route, Domain: #booking)*
- [[server_services_apifyInstagramService|server/services/apifyInstagramService.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_bookingWindowService|server/services/bookingWindowService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_emailDeliverabilityService|server/services/emailDeliverabilityService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_financialBreakEvenService|server/services/financialBreakEvenService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_googlePlacesVenueService|server/services/googlePlacesVenueService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_jinaReaderService|server/services/jinaReaderService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_localBandPartnersService|server/services/localBandPartnersService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_localEventsClashService|server/services/localEventsClashService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_localPressMediaService|server/services/localPressMediaService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_setlistVenueService|server/services/setlistVenueService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_socialEngagementService|server/services/socialEngagementService.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_spotifyAudienceService|server/services/spotifyAudienceService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_tourLogisticsService|server/services/tourLogisticsService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_venueEventsRadarService|server/services/venueEventsRadarService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[sec_ssrf_guard|SSRF URL Validator]] *(from #security)*
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/seguridadAutorizacion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
