---
id: src_components_calendar_CalendarEventDetailModal
title: "src/components/calendar/CalendarEventDetailModal.tsx"
layer: frontend
domain: system
file: "src/components/calendar/CalendarEventDetailModal.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/CalendarEventDetailModal.tsx

> **Ubicación:** `src/components/calendar/CalendarEventDetailModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Ficha emergente de un evento del calendario (concierto o ensayo): resumen, logística, contactos,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_event_detail_EventDetailLayout|src/components/calendar/event_detail/EventDetailLayout.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_event_detail_EventDetailProvider|src/components/calendar/event_detail/EventDetailProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_event_detail_hooks_useEventDetailController|src/components/calendar/event_detail/hooks/useEventDetailController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_weatherService|src/services/weatherService.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_event_detail_EventDetailContext|src/components/calendar/event_detail/EventDetailContext.ts]] *(from #frontend)*
- [[src_components_calendar_views_CalendarOverlays|src/components/calendar/views/CalendarOverlays.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
