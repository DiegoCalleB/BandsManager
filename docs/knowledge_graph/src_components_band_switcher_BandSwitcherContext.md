---
id: src_components_band_switcher_BandSwitcherContext
title: "src/components/band_switcher/BandSwitcherContext.ts"
layer: frontend
domain: system
file: "src/components/band_switcher/BandSwitcherContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/band_switcher/BandSwitcherContext.ts

> **Ubicación:** `src/components/band_switcher/BandSwitcherContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del selector de bandas: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_BandSwitcherModal|src/components/BandSwitcherModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_hooks_useBandSwitcherController|src/components/band_switcher/hooks/useBandSwitcherController.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_band_switcher_BandCardsGrid|src/components/band_switcher/BandCardsGrid.tsx]] *(from #frontend)*
- [[src_components_band_switcher_BandSettingsModal|src/components/band_switcher/BandSettingsModal.tsx]] *(from #frontend)*
- [[src_components_band_switcher_BandSwitcherFooter|src/components/band_switcher/BandSwitcherFooter.tsx]] *(from #frontend)*
- [[src_components_band_switcher_BandSwitcherLayout|src/components/band_switcher/BandSwitcherLayout.tsx]] *(from #frontend)*
- [[src_components_band_switcher_BandSwitcherProvider|src/components/band_switcher/BandSwitcherProvider.tsx]] *(from #frontend)*
- [[src_components_band_switcher_CreateBandModal|src/components/band_switcher/CreateBandModal.tsx]] *(from #frontend)*
- [[src_components_band_switcher_CreateBandStepOne|src/components/band_switcher/CreateBandStepOne.tsx]] *(from #frontend)*
- [[src_components_band_switcher_CreateBandStepTwo|src/components/band_switcher/CreateBandStepTwo.tsx]] *(from #frontend)*
- [[src_components_band_switcher_DeleteBandModal|src/components/band_switcher/DeleteBandModal.tsx]] *(from #frontend)*
- [[src_components_band_switcher_PlanCardCabezaDeCartel|src/components/band_switcher/PlanCardCabezaDeCartel.tsx]] *(from #frontend)*
- [[src_components_band_switcher_PlanCardDeGira|src/components/band_switcher/PlanCardDeGira.tsx]] *(from #frontend)*
- [[src_components_band_switcher_PlanCardEnsayo|src/components/band_switcher/PlanCardEnsayo.tsx]] *(from #frontend)*
- [[src_components_band_switcher_PlanCardLocal|src/components/band_switcher/PlanCardLocal.tsx]] *(from #frontend)*
- [[src_components_band_switcher_UpgradePlanModal|src/components/band_switcher/UpgradePlanModal.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/band_switcher/__tests__/bandSwitcherContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
