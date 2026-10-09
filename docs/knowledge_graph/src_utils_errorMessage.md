---
id: src_utils_errorMessage
title: "src/utils/errorMessage.ts"
layer: service
domain: system
file: "src/utils/errorMessage.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/errorMessage.ts

> **Ubicación:** `src/utils/errorMessage.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Extracción segura del mensaje de un valor capturado en `catch`, que en TypeScript estricto es `unknown`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueEnrichment|src/components/booking/venue_panel/hooks/useVenueEnrichment.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueScoutActions|src/components/booking/venue_panel/hooks/useVenueScoutActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueAgentWorkflowBanner|src/components/booking/venue_panel/VenueAgentWorkflowBanner.tsx]] *(from #agent)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/errorMessage.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
