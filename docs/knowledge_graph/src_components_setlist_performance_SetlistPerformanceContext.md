---
id: src_components_setlist_performance_SetlistPerformanceContext
title: "src/components/setlist_performance/SetlistPerformanceContext.ts"
layer: frontend
domain: repertoire
file: "src/components/setlist_performance/SetlistPerformanceContext.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/setlist_performance/SetlistPerformanceContext.ts

> **Ubicación:** `src/components/setlist_performance/SetlistPerformanceContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Contexto del visor de repertorio en directo: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_useSetlistPerformanceController|src/components/setlist_performance/hooks/useSetlistPerformanceController.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_setlist_performance_PerformanceBanners|src/components/setlist_performance/PerformanceBanners.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceEmptyState|src/components/setlist_performance/PerformanceEmptyState.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceFooter|src/components/setlist_performance/PerformanceFooter.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceMoreMenu|src/components/setlist_performance/PerformanceMoreMenu.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformancePage|src/components/setlist_performance/PerformancePage.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformancePracticePanel|src/components/setlist_performance/PerformancePracticePanel.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceRehearsalBar|src/components/setlist_performance/PerformanceRehearsalBar.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceRestScreen|src/components/setlist_performance/PerformanceRestScreen.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceSongDrawer|src/components/setlist_performance/PerformanceSongDrawer.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceTopBar|src/components/setlist_performance/PerformanceTopBar.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_SetlistPerformanceProvider|src/components/setlist_performance/SetlistPerformanceProvider.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_SetlistPerformanceRoot|src/components/setlist_performance/SetlistPerformanceRoot.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_SetlistPerformanceStage|src/components/setlist_performance/SetlistPerformanceStage.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/setlist_performance/__tests__/setlistPerformanceContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
