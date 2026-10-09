---
id: src_hooks_useSetlistEnergyAnalysis
title: "src/hooks/useSetlistEnergyAnalysis.ts"
layer: hook
domain: repertoire
file: "src/hooks/useSetlistEnergyAnalysis.ts"
tags: ["hook", "repertoire", "auto"]
---

# 📌 src/hooks/useSetlistEnergyAnalysis.ts

> **Ubicación:** `src/hooks/useSetlistEnergyAnalysis.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: EnergyZone, UseSetlistEnergyAnalysisResult, useSetlistEnergyAnalysis.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SetlistsTabContentView|src/components/repertorio/SetlistsTabContentView.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/hooks/__tests__/useSetlistEnergyAnalysis.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
