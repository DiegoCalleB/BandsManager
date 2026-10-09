---
id: src_components_CalendarView
title: "src/components/CalendarView.tsx"
layer: frontend
domain: system
file: "src/components/CalendarView.tsx"
tags: ["frontend", "system", "auto", "pantalla"]
---

# 📌 src/components/CalendarView.tsx

> **Ubicación:** `src/components/CalendarView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: CalendarView.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_DirectionsCard|src/components/DirectionsCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_calendar_AnimatedWeatherIcon|src/components/calendar/AnimatedWeatherIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarConflictsBanner|src/components/calendar/CalendarConflictsBanner.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarCreateEventModal|src/components/calendar/CalendarCreateEventModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarEditConcertModal|src/components/calendar/CalendarEditConcertModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarEditRehearsalModal|src/components/calendar/CalendarEditRehearsalModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarEventDetailModal|src/components/calendar/CalendarEventDetailModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarReminderModal|src/components/calendar/CalendarReminderModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarSidebarLogistics|src/components/calendar/CalendarSidebarLogistics.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarSyncModal|src/components/calendar/CalendarSyncModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarViewsContainer|src/components/calendar/CalendarViewsContainer.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_ConcertBreakEvenCard|src/components/calendar/ConcertBreakEvenCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_EventWeatherCard|src/components/calendar/EventWeatherCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_useCalendarConflicts|src/components/calendar/useCalendarConflicts.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_useCalendarRoadbook|src/components/calendar/useCalendarRoadbook.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_HolidayDateWarning|src/components/common/HolidayDateWarning.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModuleTutorialModal|src/components/common/ModuleTutorialModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModuleTutorialTrigger|src/components/common/ModuleTutorialTrigger.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_i18n_fansTranslations|src/i18n/fansTranslations.ts]] *(Layer: #service, Domain: #social)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_services_weatherService|src/services/weatherService.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_calendarConflicts|src/utils/calendarConflicts.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_calendarViewPreferences|src/utils/calendarViewPreferences.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_webPush|src/utils/webPush.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
