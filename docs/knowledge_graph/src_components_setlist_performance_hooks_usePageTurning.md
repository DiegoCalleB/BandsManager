---
id: src_components_setlist_performance_hooks_usePageTurning
title: "src/components/setlist_performance/hooks/usePageTurning.ts"
layer: frontend
domain: repertoire
file: "src/components/setlist_performance/hooks/usePageTurning.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/setlist_performance/hooks/usePageTurning.ts

> **Ubicación:** `src/components/setlist_performance/hooks/usePageTurning.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: PageTurningParams, usePageTurning.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_setlist_performance_performanceModel|src/components/setlist_performance/performanceModel.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_pasarPagina|src/utils/pasarPagina.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_setlist_performance_hooks_useSetlistPerformanceController|src/components/setlist_performance/hooks/useSetlistPerformanceController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
