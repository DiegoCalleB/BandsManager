---
id: src_utils_songTitleMatch
title: "src/utils/songTitleMatch.ts"
layer: service
domain: repertoire
file: "src/utils/songTitleMatch.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/songTitleMatch.ts

> **Ubicación:** `src/utils/songTitleMatch.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Minúsculas, sin tildes/diacríticos, sin espacios extra — para que "Traca Final" case con "traca final" o "Traca Fínal" sin fallar por acentuación.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
