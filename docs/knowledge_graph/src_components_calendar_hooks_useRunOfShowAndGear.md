---
id: src_components_calendar_hooks_useRunOfShowAndGear
title: "src/components/calendar/hooks/useRunOfShowAndGear.ts"
layer: frontend
domain: system
file: "src/components/calendar/hooks/useRunOfShowAndGear.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/hooks/useRunOfShowAndGear.ts

> **Ubicación:** `src/components/calendar/hooks/useRunOfShowAndGear.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Orden del show y equipamiento del día seleccionado, sincronizados con el servidor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
