---
id: src_hooks_useActiveSetlistMetrics
title: "src/hooks/useActiveSetlistMetrics.ts"
layer: hook
domain: repertoire
file: "src/hooks/useActiveSetlistMetrics.ts"
tags: ["hook", "repertoire", "auto"]
---

# 📌 src/hooks/useActiveSetlistMetrics.ts

> **Ubicación:** `src/hooks/useActiveSetlistMetrics.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: ActiveSetlistMetricsResult, useActiveSetlistMetrics.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/hooks/__tests__/useActiveSetlistMetrics.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
