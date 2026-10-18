---
id: server_tiposRespuestasIA
title: "server/tiposRespuestasIA.ts"
layer: service
domain: system
file: "server/tiposRespuestasIA.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/tiposRespuestasIA.ts

> **Ubicación:** `server/tiposRespuestasIA.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Formas de los JSON que devuelve el LLM y que se leen con `safeParseJson<T>`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_services_bandsintownVenueService|server/services/bandsintownVenueService.ts]] *(from #service)*
- [[server_services_googlePlacesVenueService|server/services/googlePlacesVenueService.ts]] *(from #service)*
- [[server_services_multiSourceVenueDiscoveryService|server/services/multiSourceVenueDiscoveryService.ts]] *(from #service)*
- [[server_services_publicCulturalEventsRadarService|server/services/publicCulturalEventsRadarService.ts]] *(from #service)*
- [[server_services_setlistVenueService|server/services/setlistVenueService.ts]] *(from #service)*
- [[server_services_similarBandsVenueMatcherService|server/services/similarBandsVenueMatcherService.ts]] *(from #service)*
- [[server_services_socialEngagementService|server/services/socialEngagementService.ts]] *(from #service)*
- [[server_services_spotifyAudienceService|server/services/spotifyAudienceService.ts]] *(from #service)*
- [[server_services_tourLogisticsService|server/services/tourLogisticsService.ts]] *(from #service)*
- [[server_utils_enrichCoversWithoutAudio|server/utils/enrichCoversWithoutAudio.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
