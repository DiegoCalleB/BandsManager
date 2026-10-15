---
id: src_components_setlist_performance_hooks_useSetlistPerformanceController
title: "src/components/setlist_performance/hooks/useSetlistPerformanceController.ts"
layer: frontend
domain: repertoire
file: "src/components/setlist_performance/hooks/useSetlistPerformanceController.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/setlist_performance/hooks/useSetlistPerformanceController.ts

> **Ubicación:** `src/components/setlist_performance/hooks/useSetlistPerformanceController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Controlador del visor de repertorio en directo: compone los hooks por subdominio

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_useChordSheet|src/components/setlist_performance/hooks/useChordSheet.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_useDeviceStatus|src/components/setlist_performance/hooks/useDeviceStatus.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_usePageTurning|src/components/setlist_performance/hooks/usePageTurning.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_usePerformanceChrome|src/components/setlist_performance/hooks/usePerformanceChrome.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_usePracticeLaunch|src/components/setlist_performance/hooks/usePracticeLaunch.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_useSetlistNavigation|src/components/setlist_performance/hooks/useSetlistNavigation.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_setlist_performance_hooks_useTeleprompter|src/components/setlist_performance/hooks/useTeleprompter.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_hooks_useWakeLock|src/hooks/useWakeLock.ts]] *(Layer: #hook, Domain: #system)*
- [[src_utils_stageOfflineCache|src/utils/stageOfflineCache.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_setlist_performance_SetlistPerformanceContext|src/components/setlist_performance/SetlistPerformanceContext.ts]] *(from #frontend)*
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
