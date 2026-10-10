---
id: src_components_CalendarView
title: "src/components/CalendarView.tsx"
layer: frontend
domain: system
file: "src/components/CalendarView.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/CalendarView.tsx

> **Ubicación:** `src/components/CalendarView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Calendario de la banda: conciertos, ensayos y reuniones con agenda, ficha y logística.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_CalendarProvider|src/components/calendar/CalendarProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_views_CalendarLayout|src/components/calendar/views/CalendarLayout.tsx]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/components/calendar/__tests__/calendarModularizationContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
