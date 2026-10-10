---
id: src_components_atril_hooks_useChordAnalysis
title: "src/components/atril/hooks/useChordAnalysis.ts"
layer: frontend
domain: repertoire
file: "src/components/atril/hooks/useChordAnalysis.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/hooks/useChordAnalysis.ts

> **Ubicación:** `src/components/atril/hooks/useChordAnalysis.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Análisis de acordes a partir del audio del tema.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_analisisAcordesCliente|src/utils/analisisAcordesCliente.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_hooks_useAtrilController|src/components/atril/hooks/useAtrilController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
