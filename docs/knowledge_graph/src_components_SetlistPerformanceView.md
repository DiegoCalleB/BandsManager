---
id: src_components_SetlistPerformanceView
title: "src/components/SetlistPerformanceView.tsx"
layer: frontend
domain: repertoire
file: "src/components/SetlistPerformanceView.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/SetlistPerformanceView.tsx

> **Ubicación:** `src/components/SetlistPerformanceView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Visor de repertorio en directo / ensayo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_setlist_performance_SetlistPerformanceProvider|src/components/setlist_performance/SetlistPerformanceProvider.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_SetlistPerformanceRoot|src/components/setlist_performance/SetlistPerformanceRoot.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_useSetlistPerformanceController|src/components/setlist_performance/hooks/useSetlistPerformanceController.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[src_components_calendar_views_CalendarOverlays|src/components/calendar/views/CalendarOverlays.tsx]] *(from #frontend)*
- [[src_components_ensayos_EnsayosManager|src/components/ensayos/EnsayosManager.tsx]] *(from #frontend)*
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_hooks_useSetlistPerformanceController|src/components/setlist_performance/hooks/useSetlistPerformanceController.ts]] *(from #frontend)*
- [[src_components_setlist_performance_SetlistPerformanceContext|src/components/setlist_performance/SetlistPerformanceContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
