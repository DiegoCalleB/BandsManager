---
id: src_utils_calendarConflicts
title: "src/utils/calendarConflicts.ts"
layer: service
domain: system
file: "src/utils/calendarConflicts.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/calendarConflicts.ts

> **Ubicación:** `src/utils/calendarConflicts.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Detector de choques de calendario (conciertos, ensayos y reuniones).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_viajeEstimado|src/utils/viajeEstimado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*
- [[src_components_calendar_CalendarConflictsBanner|src/components/calendar/CalendarConflictsBanner.tsx]] *(from #frontend)*
- [[src_components_calendar_hooks_useCalendarFilters|src/components/calendar/hooks/useCalendarFilters.ts]] *(from #frontend)*
- [[src_components_calendar_useCalendarConflicts|src/components/calendar/useCalendarConflicts.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/calendarConflictService.test.ts`
- `src/utils/__tests__/calendarConflicts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
