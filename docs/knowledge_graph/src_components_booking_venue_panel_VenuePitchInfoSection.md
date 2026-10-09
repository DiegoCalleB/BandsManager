---
id: src_components_booking_venue_panel_VenuePitchInfoSection
title: "src/components/booking/venue_panel/VenuePitchInfoSection.tsx"
layer: frontend
domain: booking
file: "src/components/booking/venue_panel/VenuePitchInfoSection.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/venue_panel/VenuePitchInfoSection.tsx

> **Ubicación:** `src/components/booking/venue_panel/VenuePitchInfoSection.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Pestaña de pitch y edición directa de la ficha del lead.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_QuickDealSimulator|src/components/booking/QuickDealSimulator.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueLeadInfoEditForm|src/components/booking/venue_panel/VenueLeadInfoEditForm.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenuePitchComposer|src/components/booking/venue_panel/VenuePitchComposer.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenuePitchFeedbackPanel|src/components/booking/venue_panel/VenuePitchFeedbackPanel.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenuePlaybookBanner|src/components/booking/venue_panel/VenuePlaybookBanner.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_venueTheme|src/components/booking/venue_panel/venueTheme.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_HolidayDateWarning|src/components/common/HolidayDateWarning.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingFollowup|src/utils/bookingFollowup.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_bookingTourContext|src/utils/bookingTourContext.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_festivalDateFormat|src/utils/festivalDateFormat.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
