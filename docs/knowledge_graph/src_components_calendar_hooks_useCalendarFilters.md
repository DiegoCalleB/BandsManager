---
id: src_components_calendar_hooks_useCalendarFilters
title: "src/components/calendar/hooks/useCalendarFilters.ts"
layer: frontend
domain: system
file: "src/components/calendar/hooks/useCalendarFilters.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/hooks/useCalendarFilters.ts

> **Ubicación:** `src/components/calendar/hooks/useCalendarFilters.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Búsqueda, filtros por banda y choques entre eventos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_useCalendarConflicts|src/components/calendar/useCalendarConflicts.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_calendarConflicts|src/utils/calendarConflicts.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
