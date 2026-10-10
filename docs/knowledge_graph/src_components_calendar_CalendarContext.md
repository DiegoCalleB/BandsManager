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
- [[src_components_calendar_logistics_ClosingChecklistTab|src/components/calendar/logistics/ClosingChecklistTab.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_ConcertQrWidget|src/components/calendar/logistics/ConcertQrWidget.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_ContactsTab|src/components/calendar/logistics/ContactsTab.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_EventCoreInfo|src/components/calendar/logistics/EventCoreInfo.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_EventDetailPanel|src/components/calendar/logistics/EventDetailPanel.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_EventSetlistWidget|src/components/calendar/logistics/EventSetlistWidget.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_EventWeatherPanel|src/components/calendar/logistics/EventWeatherPanel.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_FreeDayCampaigns|src/components/calendar/logistics/FreeDayCampaigns.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_GearChecklistTab|src/components/calendar/logistics/GearChecklistTab.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_LogisticsSidebar|src/components/calendar/logistics/LogisticsSidebar.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_LogisticsSubtabsBar|src/components/calendar/logistics/LogisticsSubtabsBar.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_LogisticsTabContent|src/components/calendar/logistics/LogisticsTabContent.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_MerchTab|src/components/calendar/logistics/MerchTab.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_MultiDayEventSelector|src/components/calendar/logistics/MultiDayEventSelector.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_RehearsalMeetingWidget|src/components/calendar/logistics/RehearsalMeetingWidget.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_RunOfShowTab|src/components/calendar/logistics/RunOfShowTab.tsx]] *(from #frontend)*
- [[src_components_calendar_logistics_UpcomingEventsList|src/components/calendar/logistics/UpcomingEventsList.tsx]] *(from #frontend)*
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
