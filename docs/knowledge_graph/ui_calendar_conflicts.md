---
id: ui_calendar_conflicts
title: "Avisos de choque en el calendario"
layer: frontend
domain: booking
file: "src/components/calendar/useCalendarConflicts.ts"
tags: ["ui", "calendar"]
---

# 📌 Avisos de choque en el calendario

> **Ubicación:** `src/components/calendar/useCalendarConflicts.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Hook (detección local + cruce de bandas del servidor), banner, triángulo por día y sección en la ficha del evento (CalendarEventConflicts).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[util_calendar_conflicts|Detector de choques del calendario]] *(Layer: #service, Domain: #booking)*
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(Layer: #route, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
