---
id: src_utils_bookingFollowup
title: "src/utils/bookingFollowup.ts"
layer: service
domain: booking
file: "src/utils/bookingFollowup.ts"
tags: ["service", "booking", "auto"]
---

# 📌 src/utils/bookingFollowup.ts

> **Ubicación:** `src/utils/bookingFollowup.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: isLeadNeedsFollowup, getDaysSinceContact, generateFollowupTemplate.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_modal_VenueEmailThread|src/components/booking/venue_modal/VenueEmailThread.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueEmailsSection|src/components/booking/venue_panel/VenueEmailsSection.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueLeadInfoEditForm|src/components/booking/venue_panel/VenueLeadInfoEditForm.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenuePitchInfoSection|src/components/booking/venue_panel/VenuePitchInfoSection.tsx]] *(from #frontend)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
