---
id: src_components_setlist_performance_performanceModel
title: "src/components/setlist_performance/performanceModel.ts"
layer: frontend
domain: repertoire
file: "src/components/setlist_performance/performanceModel.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/setlist_performance/performanceModel.ts

> **Ubicación:** `src/components/setlist_performance/performanceModel.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SWIPE_THRESHOLD, FONT_SIZES, BLOCK_META, getBlockMeta, itemLabel.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_setlist_performance_hooks_usePageTurning|src/components/setlist_performance/hooks/usePageTurning.ts]] *(from #frontend)*
- [[src_components_setlist_performance_hooks_useSetlistNavigation|src/components/setlist_performance/hooks/useSetlistNavigation.ts]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceFooter|src/components/setlist_performance/PerformanceFooter.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceMoreMenu|src/components/setlist_performance/PerformanceMoreMenu.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformancePage|src/components/setlist_performance/PerformancePage.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceRestScreen|src/components/setlist_performance/PerformanceRestScreen.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceSongDrawer|src/components/setlist_performance/PerformanceSongDrawer.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/setlist_performance/__tests__/setlistPerformanceContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
