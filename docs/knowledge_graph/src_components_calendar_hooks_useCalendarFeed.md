---
id: src_components_calendar_hooks_useCalendarFeed
title: "src/components/calendar/hooks/useCalendarFeed.ts"
layer: frontend
domain: system
file: "src/components/calendar/hooks/useCalendarFeed.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/hooks/useCalendarFeed.ts

> **Ubicación:** `src/components/calendar/hooks/useCalendarFeed.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Modal de sincronización y URL del feed iCal de la banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
