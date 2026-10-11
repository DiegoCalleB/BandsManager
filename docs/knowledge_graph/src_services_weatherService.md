---
id: src_services_weatherService
title: "src/services/weatherService.ts"
layer: service
domain: system
file: "src/services/weatherService.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/services/weatherService.ts

> **Ubicación:** `src/services/weatherService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: WeatherAlert, EventWeatherData, DetectAlertsParams, detectWeatherAlerts, fetchEventWeather, getCachedEventWeatherAlerts.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_AnimatedWeatherIcon|src/components/calendar/AnimatedWeatherIcon.tsx]] *(from #frontend)*
- [[src_components_calendar_CalendarEventDetailModal|src/components/calendar/CalendarEventDetailModal.tsx]] *(from #frontend)*
- [[src_components_calendar_CalendarViewsContainer|src/components/calendar/CalendarViewsContainer.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_hooks_useEventDetailController|src/components/calendar/event_detail/hooks/useEventDetailController.ts]] *(from #frontend)*
- [[src_components_calendar_EventWeatherCard|src/components/calendar/EventWeatherCard.tsx]] *(from #frontend)*
- [[src_components_calendar_hooks_useEventFicha|src/components/calendar/hooks/useEventFicha.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useEventShareActions|src/components/calendar/hooks/useEventShareActions.ts]] *(from #frontend)*
- [[src_components_calendar_views_MonthGrids|src/components/calendar/views/MonthGrids.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/services/__tests__/weatherService.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
