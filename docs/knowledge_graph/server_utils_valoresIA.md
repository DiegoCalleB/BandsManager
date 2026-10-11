---
id: server_utils_valoresIA
title: "server/utils/valoresIA.ts"
layer: service
domain: system
file: "server/utils/valoresIA.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/valoresIA.ts

> **Ubicación:** `server/utils/valoresIA.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Validadores mínimos para campos de JSON generados por un LLM, que pueden llegar con cualquier tipo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_googlePlacesVenueService|server/services/googlePlacesVenueService.ts]] *(from #service)*
- [[server_services_setlistVenueService|server/services/setlistVenueService.ts]] *(from #service)*
- [[server_services_socialEngagementService|server/services/socialEngagementService.ts]] *(from #service)*
- [[server_services_spotifyAudienceService|server/services/spotifyAudienceService.ts]] *(from #service)*
- [[server_services_tourLogisticsService|server/services/tourLogisticsService.ts]] *(from #service)*
- [[server_utils_enrichCoversWithoutAudio|server/utils/enrichCoversWithoutAudio.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/valoresIA.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
