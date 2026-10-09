---
id: src_components_repertorio_SetlistsTabContentView
title: "src/components/repertorio/SetlistsTabContentView.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/SetlistsTabContentView.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/SetlistsTabContentView.tsx

> **Ubicación:** `src/components/repertorio/SetlistsTabContentView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SetlistsTabContentViewProps, SetlistsTabContentView.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_ActiveSetlistHeader|src/components/repertorio/ActiveSetlistHeader.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_EnergyMapCard|src/components/repertorio/EnergyMapCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_SetlistAddBar|src/components/repertorio/SetlistAddBar.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistItemsList|src/components/repertorio/SetlistItemsList.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistStatsSummaryBar|src/components/repertorio/SetlistStatsSummaryBar.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_hooks_useSetlistEnergyAnalysis|src/hooks/useSetlistEnergyAnalysis.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/__tests__/SetlistsTabContentViewContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
