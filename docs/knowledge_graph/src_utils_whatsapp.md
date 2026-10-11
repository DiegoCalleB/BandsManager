---
id: src_utils_whatsapp
title: "src/utils/whatsapp.ts"
layer: service
domain: system
file: "src/utils/whatsapp.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/whatsapp.ts

> **Ubicación:** `src/utils/whatsapp.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
WhatsApp integration utilities for BandManager.io

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandPitchModal|src/components/bandCRM/BandPitchModal.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadCardActions|src/components/booking/leads_table/LeadCardActions.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadRowActions|src/components/booking/leads_table/LeadRowActions.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueContactRosterCards|src/components/booking/venue_panel/VenueContactRosterCards.tsx]] *(from #frontend)*
- [[src_components_calendar_hooks_useEventShareActions|src/components/calendar/hooks/useEventShareActions.ts]] *(from #frontend)*
- [[src_components_calendar_logistics_ContactsTab|src/components/calendar/logistics/ContactsTab.tsx]] *(from #frontend)*
- [[src_components_calendar_useCalendarRoadbook|src/components/calendar/useCalendarRoadbook.ts]] *(from #frontend)*
- [[src_components_fans_landing_BookingContactSection|src/components/fans_landing/BookingContactSection.tsx]] *(from #frontend)*
- [[src_components_fans_landing_FansLandingSuccess|src/components/fans_landing/FansLandingSuccess.tsx]] *(from #frontend)*
- [[src_components_fans_panel_hooks_useQrSharing|src/components/fans_panel/hooks/useQrSharing.ts]] *(from #frontend)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(from #frontend)*
- [[src_utils_shareUtils|src/utils/shareUtils.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/whatsapp.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
