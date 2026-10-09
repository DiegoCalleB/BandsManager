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
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*
- [[src_components_calendar_CalendarSidebarLogistics|src/components/calendar/CalendarSidebarLogistics.tsx]] *(from #frontend)*
- [[src_components_calendar_useCalendarRoadbook|src/components/calendar/useCalendarRoadbook.ts]] *(from #frontend)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(from #frontend)*
- [[src_components_FansLanding|src/components/FansLanding.tsx]] *(from #frontend)*
- [[src_components_FansPanel|src/components/FansPanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(from #frontend)*
- [[src_utils_shareUtils|src/utils/shareUtils.ts]] *(from #service)*
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/whatsapp.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
