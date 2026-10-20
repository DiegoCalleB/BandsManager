---
id: util_calendar_conflicts
title: "Detector de choques del calendario"
layer: service
domain: booking
file: "src/utils/calendarConflicts.ts"
tags: ["calendar", "conflicts", "pure"]
---

# 📌 Detector de choques del calendario

> **Ubicación:** `src/utils/calendarConflicts.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Detector puro y determinista (cliente + servidor): solapes, margen corto, viaje inviable y mismo día. Un choque exige una persona en ambos sitios. Redacta datos de otras bandas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[util_viaje_estimado|Estimador de viaje offline]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(from #route)*
- [[service_calendar_conflicts|Avisos de choques por email]] *(from #service)*
- [[src_components_calendar_CalendarConflictsBanner|src/components/calendar/CalendarConflictsBanner.tsx]] *(from #frontend)*
- [[src_components_calendar_CalendarEventConflicts|src/components/calendar/CalendarEventConflicts.tsx]] *(from #frontend)*
- [[src_components_calendar_CalendarEventDetailModal|src/components/calendar/CalendarEventDetailModal.tsx]] *(from #frontend)*
- [[src_components_calendar_hooks_useCalendarFilters|src/components/calendar/hooks/useCalendarFilters.ts]] *(from #frontend)*
- [[src_components_calendar_views_CalendarOverlays|src/components/calendar/views/CalendarOverlays.tsx]] *(from #frontend)*
- [[ui_calendar_conflicts|Avisos de choque en el calendario]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/calendarConflictService.test.ts`
- `src/utils/__tests__/calendarConflicts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
