---
id: src_components_calendar_CalendarContext
title: "src/components/calendar/CalendarContext.ts"
layer: frontend
domain: system
file: "src/components/calendar/CalendarContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/CalendarContext.ts

> **Ubicación:** `src/components/calendar/CalendarContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del Calendario: reparte el estado y las acciones del controlador a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_CalendarProvider|src/components/calendar/CalendarProvider.tsx]] *(from #frontend)*
- [[src_components_calendar_views_BandFilterToggle|src/components/calendar/views/BandFilterToggle.tsx]] *(from #frontend)*
- [[src_components_calendar_views_CalendarLayout|src/components/calendar/views/CalendarLayout.tsx]] *(from #frontend)*
- [[src_components_calendar_views_CalendarOverlays|src/components/calendar/views/CalendarOverlays.tsx]] *(from #frontend)*
- [[src_components_calendar_views_CalendarSearchBar|src/components/calendar/views/CalendarSearchBar.tsx]] *(from #frontend)*
- [[src_components_calendar_views_CalendarSyncNotices|src/components/calendar/views/CalendarSyncNotices.tsx]] *(from #frontend)*
- [[src_components_calendar_views_CalendarTitleBar|src/components/calendar/views/CalendarTitleBar.tsx]] *(from #frontend)*
- [[src_components_calendar_views_ConcertDetailCard|src/components/calendar/views/ConcertDetailCard.tsx]] *(from #frontend)*
- [[src_components_calendar_views_DayAgendaHeader|src/components/calendar/views/DayAgendaHeader.tsx]] *(from #frontend)*
- [[src_components_calendar_views_DayEventSelector|src/components/calendar/views/DayEventSelector.tsx]] *(from #frontend)*
- [[src_components_calendar_views_MonthGrids|src/components/calendar/views/MonthGrids.tsx]] *(from #frontend)*
- [[src_components_calendar_views_PeriodNavigation|src/components/calendar/views/PeriodNavigation.tsx]] *(from #frontend)*
- [[src_components_calendar_views_RehearsalDetailCard|src/components/calendar/views/RehearsalDetailCard.tsx]] *(from #frontend)*
- [[src_components_calendar_views_SelectedDayAgenda|src/components/calendar/views/SelectedDayAgenda.tsx]] *(from #frontend)*
- [[src_components_calendar_views_ViewSwitchers|src/components/calendar/views/ViewSwitchers.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/calendar/__tests__/calendarModularizationContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
