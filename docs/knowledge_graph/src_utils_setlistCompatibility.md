---
id: src_utils_setlistCompatibility
title: "src/utils/setlistCompatibility.ts"
layer: service
domain: repertoire
file: "src/utils/setlistCompatibility.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/setlistCompatibility.ts

> **Ubicación:** `src/utils/setlistCompatibility.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: CosteTransicion, calcularCosteTransicion, EvaluacionUnion, evaluarCalidadUnion, HuecoCancion, SugerenciaChapa, sugerirMejorPuntoParaChapa, costeTotalTransiciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(from #frontend)*
- [[src_components_repertorio_EnergyMapCard|src/components/repertorio/EnergyMapCard.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistSongRow|src/components/repertorio/SetlistSongRow.tsx]] *(from #frontend)*
- [[src_hooks_useSetlistTransitionsOptimizer|src/hooks/useSetlistTransitionsOptimizer.ts]] *(from #hook)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/setlistCompatibility.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
