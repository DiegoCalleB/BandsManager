---
id: server_utils
title: "server/utils.ts"
layer: service
domain: system
file: "server/utils.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils.ts

> **Ubicación:** `server/utils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: safeParseJson, cleanBandId.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[server_services_bandsintownVenueService|server/services/bandsintownVenueService.ts]] *(from #service)*
- [[server_services_googlePlacesVenueService|server/services/googlePlacesVenueService.ts]] *(from #service)*
- [[server_services_multiSourceVenueDiscoveryService|server/services/multiSourceVenueDiscoveryService.ts]] *(from #service)*
- [[server_services_publicCulturalEventsRadarService|server/services/publicCulturalEventsRadarService.ts]] *(from #service)*
- [[server_services_setlistVenueService|server/services/setlistVenueService.ts]] *(from #service)*
- [[server_services_similarBandsVenueMatcherService|server/services/similarBandsVenueMatcherService.ts]] *(from #service)*
- [[server_services_socialEngagementService|server/services/socialEngagementService.ts]] *(from #service)*
- [[server_services_spotifyAudienceService|server/services/spotifyAudienceService.ts]] *(from #service)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(from #service)*
- [[server_services_tourLogisticsService|server/services/tourLogisticsService.ts]] *(from #service)*
- [[server_utils_enrichCoversWithoutAudio|server/utils/enrichCoversWithoutAudio.ts]] *(from #service)*
- [[server_utils_templateOptimizer|server/utils/templateOptimizer.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
