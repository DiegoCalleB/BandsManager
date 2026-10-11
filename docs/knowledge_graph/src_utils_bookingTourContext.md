---
id: src_utils_bookingTourContext
title: "src/utils/bookingTourContext.ts"
layer: service
domain: booking
file: "src/utils/bookingTourContext.ts"
tags: ["service", "booking", "auto"]
---

# 📌 src/utils/bookingTourContext.ts

> **Ubicación:** `src/utils/bookingTourContext.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: BandDateAvailability, CityPerformanceHistory, CommercialDealType, CommercialDealSnippet, normalizeCityName, checkBandDateConflict, getCityTourHistory, getCommercialDealSnippets.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_tourRouting|src/utils/tourRouting.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadDatesTableBadges|src/components/booking/leads_table/LeadDatesTableBadges.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadSourcePills|src/components/booking/leads_table/LeadSourcePills.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueEmailsSection|src/components/booking/venue_panel/VenueEmailsSection.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenuePitchComposer|src/components/booking/venue_panel/VenuePitchComposer.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueScoutToolbar|src/components/booking/venue_panel/VenueScoutToolbar.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
