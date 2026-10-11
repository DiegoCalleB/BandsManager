---
id: src_components_calendar_event_detail_hooks_useEventDetailController
title: "src/components/calendar/event_detail/hooks/useEventDetailController.ts"
layer: frontend
domain: system
file: "src/components/calendar/event_detail/hooks/useEventDetailController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/event_detail/hooks/useEventDetailController.ts

> **Ubicación:** `src/components/calendar/event_detail/hooks/useEventDetailController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Estado local y datos derivados de la ficha de evento: navegación cronológica, menús, formularios y hoja de ruta.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_weatherService|src/services/weatherService.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_CalendarEventDetailModal|src/components/calendar/CalendarEventDetailModal.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_EventDetailContext|src/components/calendar/event_detail/EventDetailContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
