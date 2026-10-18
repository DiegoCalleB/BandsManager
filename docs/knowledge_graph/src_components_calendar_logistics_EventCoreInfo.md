---
id: src_components_calendar_logistics_EventCoreInfo
title: "src/components/calendar/logistics/EventCoreInfo.tsx"
layer: frontend
domain: system
file: "src/components/calendar/logistics/EventCoreInfo.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/logistics/EventCoreInfo.tsx

> **Ubicación:** `src/components/calendar/logistics/EventCoreInfo.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Información principal del evento: hora, lugar, entradas, notas, convocatoria y widgets.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_DirectionsCard|src/components/DirectionsCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarContext|src/components/calendar/CalendarContext.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_ConcertBreakEvenCard|src/components/calendar/ConcertBreakEvenCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_calendarTheme|src/components/calendar/calendarTheme.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_logistics_ConcertQrWidget|src/components/calendar/logistics/ConcertQrWidget.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_logistics_EventSetlistWidget|src/components/calendar/logistics/EventSetlistWidget.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_calendar_logistics_RehearsalMeetingWidget|src/components/calendar/logistics/RehearsalMeetingWidget.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_logistics_EventDetailPanel|src/components/calendar/logistics/EventDetailPanel.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
