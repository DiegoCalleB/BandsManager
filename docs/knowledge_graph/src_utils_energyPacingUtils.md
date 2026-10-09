---
id: src_utils_energyPacingUtils
title: "src/utils/energyPacingUtils.ts"
layer: service
domain: system
file: "src/utils/energyPacingUtils.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/energyPacingUtils.ts

> **Ubicación:** `src/utils/energyPacingUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SongEnergyCategory, EnergyInfo, SetlistEnergyPoint, EnergyProfileType, PacingWarning, SetlistEnergyAnalysis, getEnergyInfo, analyzeSetlistEnergy.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_widgets_ChartWidgets|src/components/dashboard/widgets/ChartWidgets.tsx]] *(from #frontend)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(from #frontend)*
- [[src_components_repertorio_EnergyMapCard|src/components/repertorio/EnergyMapCard.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistSongRow|src/components/repertorio/SetlistSongRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistsTabContentView|src/components/repertorio/SetlistsTabContentView.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*
- [[src_hooks_useSetlistEnergyAnalysis|src/hooks/useSetlistEnergyAnalysis.ts]] *(from #hook)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/energyPacingUtils.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
