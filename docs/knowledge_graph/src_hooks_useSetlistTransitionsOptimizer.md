---
id: src_hooks_useSetlistTransitionsOptimizer
title: "src/hooks/useSetlistTransitionsOptimizer.ts"
layer: hook
domain: repertoire
file: "src/hooks/useSetlistTransitionsOptimizer.ts"
tags: ["hook", "repertoire", "auto"]
---

# 📌 src/hooks/useSetlistTransitionsOptimizer.ts

> **Ubicación:** `src/hooks/useSetlistTransitionsOptimizer.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: UndoReorderSnapshot, UseSetlistTransitionsOptimizerParams, useSetlistTransitionsOptimizer.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_PerfectSetlistModal|src/components/repertorio/PerfectSetlistModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/hooks/__tests__/useSetlistTransitionsOptimizer.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
