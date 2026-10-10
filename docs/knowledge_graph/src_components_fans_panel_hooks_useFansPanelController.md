---
id: src_components_fans_panel_hooks_useFansPanelController
title: "src/components/fans_panel/hooks/useFansPanelController.ts"
layer: frontend
domain: social
file: "src/components/fans_panel/hooks/useFansPanelController.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/fans_panel/hooks/useFansPanelController.ts

> **Ubicación:** `src/components/fans_panel/hooks/useFansPanelController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Controlador del panel de fans: pestañas, filtros, ciudades, incentivo, QR y alta manual.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_fans_panel_hooks_useCityChips|src/components/fans_panel/hooks/useCityChips.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_hooks_useFanIncentive|src/components/fans_panel/hooks/useFanIncentive.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_hooks_useFansFilters|src/components/fans_panel/hooks/useFansFilters.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_hooks_useManualFanForm|src/components/fans_panel/hooks/useManualFanForm.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_hooks_useQrCustomization|src/components/fans_panel/hooks/useQrCustomization.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_hooks_useQrLink|src/components/fans_panel/hooks/useQrLink.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_hooks_useQrSharing|src/components/fans_panel/hooks/useQrSharing.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_panel_FansPanelContext|src/components/fans_panel/FansPanelContext.ts]] *(from #frontend)*
- [[src_components_FansPanel|src/components/FansPanel.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
