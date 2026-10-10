---
id: src_components_calendar_calendarTypes
title: "src/components/calendar/calendarTypes.ts"
layer: frontend
domain: system
file: "src/components/calendar/calendarTypes.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/calendarTypes.ts

> **Ubicación:** `src/components/calendar/calendarTypes.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: CalendarBand, CalendarUser, BandTaggedEvent, CalendarViewProps, RunOfShowItem, GearItem, RoadbookInfo, BAND_COLOR_PALETTES.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_CalendarContext|src/components/calendar/CalendarContext.ts]] *(from #frontend)*
- [[src_components_calendar_CalendarEventDetailModal|src/components/calendar/CalendarEventDetailModal.tsx]] *(from #frontend)*
- [[src_components_calendar_CalendarSidebarLogistics|src/components/calendar/CalendarSidebarLogistics.tsx]] *(from #frontend)*
- [[src_components_calendar_CalendarViewsContainer|src/components/calendar/CalendarViewsContainer.tsx]] *(from #frontend)*
- [[src_components_calendar_hooks_useBandMembers|src/components/calendar/hooks/useBandMembers.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useCalendarBands|src/components/calendar/hooks/useCalendarBands.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useCalendarFeed|src/components/calendar/hooks/useCalendarFeed.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useCalendarViewPrefs|src/components/calendar/hooks/useCalendarViewPrefs.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useEventReminder|src/components/calendar/hooks/useEventReminder.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useEventShareActions|src/components/calendar/hooks/useEventShareActions.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useRunOfShowAndGear|src/components/calendar/hooks/useRunOfShowAndGear.ts]] *(from #frontend)*
- [[src_components_calendar_useCalendarRoadbook|src/components/calendar/useCalendarRoadbook.ts]] *(from #frontend)*
- [[src_components_calendar_views_ConcertDetailCard|src/components/calendar/views/ConcertDetailCard.tsx]] *(from #frontend)*
- [[src_components_calendar_views_RehearsalDetailCard|src/components/calendar/views/RehearsalDetailCard.tsx]] *(from #frontend)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
