---
id: src_utils_stageOfflineCache
title: "src/utils/stageOfflineCache.ts"
layer: service
domain: system
file: "src/utils/stageOfflineCache.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/stageOfflineCache.ts

> **Ubicación:** `src/utils/stageOfflineCache.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: StageOfflineCachePayload, cacheActiveStageSetlist, getStageOfflineCache, clearStageOfflineCache.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_EscenarioView|src/components/repertorio/EscenarioView.tsx]] *(from #frontend)*
- [[src_components_repertorio_RepertorioSetlistsView|src/components/repertorio/RepertorioSetlistsView.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_hooks_useSetlistPerformanceController|src/components/setlist_performance/hooks/useSetlistPerformanceController.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/stageOfflineCache.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
