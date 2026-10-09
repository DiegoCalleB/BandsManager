---
id: src_components_repertorio_RepertorioSetlistsView
title: "src/components/repertorio/RepertorioSetlistsView.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/RepertorioSetlistsView.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/RepertorioSetlistsView.tsx

> **Ubicación:** `src/components/repertorio/RepertorioSetlistsView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: RepertorioSetlistsViewProps, RepertorioSetlistsView.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_ActiveSetlistHeader|src/components/repertorio/ActiveSetlistHeader.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_EnergyMapCard|src/components/repertorio/EnergyMapCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_PerfectSetlistModal|src/components/repertorio/PerfectSetlistModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistAddBar|src/components/repertorio/SetlistAddBar.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistItemsList|src/components/repertorio/SetlistItemsList.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistStatsSummaryBar|src/components/repertorio/SetlistStatsSummaryBar.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_setlistItemKind|src/components/repertorio/setlistItemKind.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_hooks_useRepertorioTabs|src/hooks/useRepertorioTabs.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_songTitleMatch|src/utils/songTitleMatch.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_stageOfflineCache|src/utils/stageOfflineCache.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
