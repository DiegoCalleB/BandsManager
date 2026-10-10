---
id: src_components_calendar_views_CalendarOverlays
title: "src/components/calendar/views/CalendarOverlays.tsx"
layer: frontend
domain: system
file: "src/components/calendar/views/CalendarOverlays.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/views/CalendarOverlays.tsx

> **Ubicación:** `src/components/calendar/views/CalendarOverlays.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Barra lateral de logística, modales de alta/edición/recordatorio/ficha y modo escenario.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_calendar_CalendarContext|src/components/calendar/CalendarContext.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarCreateEventModal|src/components/calendar/CalendarCreateEventModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarEditConcertModal|src/components/calendar/CalendarEditConcertModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarEditRehearsalModal|src/components/calendar/CalendarEditRehearsalModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarEventDetailModal|src/components/calendar/CalendarEventDetailModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarReminderModal|src/components/calendar/CalendarReminderModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarSidebarLogistics|src/components/calendar/CalendarSidebarLogistics.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_CalendarSyncModal|src/components/calendar/CalendarSyncModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_calendarTheme|src/components/calendar/calendarTheme.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_views_CalendarLayout|src/components/calendar/views/CalendarLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
