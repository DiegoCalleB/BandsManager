---
id: src_components_repertorio_EnergyChart
title: "src/components/repertorio/EnergyChart.tsx"
layer: frontend
domain: system
file: "src/components/repertorio/EnergyChart.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/EnergyChart.tsx

> **Ubicación:** `src/components/repertorio/EnergyChart.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: EnergyChartPoint, EnergyChartZone, EnergyChart.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_curve|src/utils/curve.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_songTitleMatch|src/utils/songTitleMatch.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_widgets_EnergyCurve|src/components/dashboard/widgets/EnergyCurve.tsx]] *(from #frontend)*
- [[src_components_repertorio_EnergyMapCard|src/components/repertorio/EnergyMapCard.tsx]] *(from #frontend)*
- [[src_components_repertorio_PerfectSetlistModal|src/components/repertorio/PerfectSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
