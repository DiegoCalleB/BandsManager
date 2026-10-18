---
id: src_components_booking_venue_panel_apiResponses
title: "src/components/booking/venue_panel/apiResponses.ts"
layer: frontend
domain: booking
file: "src/components/booking/venue_panel/apiResponses.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/venue_panel/apiResponses.ts

> **Ubicación:** `src/components/booking/venue_panel/apiResponses.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Contratos de respuesta de los endpoints /api/leads/* que consume el panel de sala.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_panel_hooks_useVenueEnrichment|src/components/booking/venue_panel/hooks/useVenueEnrichment.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueMessageThread|src/components/booking/venue_panel/hooks/useVenueMessageThread.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueScoutActions|src/components/booking/venue_panel/hooks/useVenueScoutActions.ts]] *(from #frontend)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
