---
id: src_components_calendar_hooks_useCalendarController
title: "src/components/calendar/hooks/useCalendarController.ts"
layer: frontend
domain: system
file: "src/components/calendar/hooks/useCalendarController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/hooks/useCalendarController.ts

> **Ubicación:** `src/components/calendar/hooks/useCalendarController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Compone todos los hooks del calendario y expone el estado y los handlers que consumen las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useBandMembers|src/components/calendar/hooks/useBandMembers.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarBands|src/components/calendar/hooks/useCalendarBands.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarDates|src/components/calendar/hooks/useCalendarDates.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarFeed|src/components/calendar/hooks/useCalendarFeed.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarFilters|src/components/calendar/hooks/useCalendarFilters.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarFullscreen|src/components/calendar/hooks/useCalendarFullscreen.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarNavigation|src/components/calendar/hooks/useCalendarNavigation.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarViewPrefs|src/components/calendar/hooks/useCalendarViewPrefs.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useConcertSyncMessages|src/components/calendar/hooks/useConcertSyncMessages.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCreateEventForm|src/components/calendar/hooks/useCreateEventForm.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useEventFicha|src/components/calendar/hooks/useEventFicha.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useEventInlineEdit|src/components/calendar/hooks/useEventInlineEdit.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useEventReminder|src/components/calendar/hooks/useEventReminder.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useEventShareActions|src/components/calendar/hooks/useEventShareActions.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useRunOfShowAndGear|src/components/calendar/hooks/useRunOfShowAndGear.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useSelectedEventDetails|src/components/calendar/hooks/useSelectedEventDetails.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useUpcomingEvents|src/components/calendar/hooks/useUpcomingEvents.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_CalendarContext|src/components/calendar/CalendarContext.ts]] *(from #frontend)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
