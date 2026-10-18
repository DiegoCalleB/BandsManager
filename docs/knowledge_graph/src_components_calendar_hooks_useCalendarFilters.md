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
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[ui_calendar_conflicts|Avisos de choque en el calendario]] *(Layer: #frontend, Domain: #booking)*
- [[util_calendar_conflicts|Detector de choques del calendario]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
