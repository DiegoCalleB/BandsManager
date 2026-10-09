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
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
