---
id: src_components_booking_venue_panel_VenuePitchComposer
title: "src/components/booking/venue_panel/VenuePitchComposer.tsx"
layer: frontend
domain: booking
file: "src/components/booking/venue_panel/VenuePitchComposer.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/venue_panel/VenuePitchComposer.tsx

> **Ubicación:** `src/components/booking/venue_panel/VenuePitchComposer.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Barra de acciones, banners de campaña, fechas, snippets de deal y editor del pitch.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_common_HolidayDateWarning|src/components/common/HolidayDateWarning.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingTourContext|src/utils/bookingTourContext.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_panel_VenuePitchInfoSection|src/components/booking/venue_panel/VenuePitchInfoSection.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenuePlaybookBanner|src/components/booking/venue_panel/VenuePlaybookBanner.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
