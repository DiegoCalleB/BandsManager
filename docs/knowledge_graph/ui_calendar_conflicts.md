---
id: ui_calendar_conflicts
title: "Avisos de choque en el calendario"
layer: frontend
domain: booking
file: "src/components/calendar/useCalendarConflicts.ts"
tags: ["ui", "calendar"]
---

# 📌 Avisos de choque en el calendario

> **Ubicación:** `src/components/calendar/useCalendarConflicts.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Hook (detección local + cruce de bandas del servidor), banner, triángulo por día y sección en la ficha del evento (CalendarEventConflicts).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(Layer: #route, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[util_calendar_conflicts|Detector de choques del calendario]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_hooks_useCalendarFilters|src/components/calendar/hooks/useCalendarFilters.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
