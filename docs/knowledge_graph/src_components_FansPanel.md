---
id: src_components_FansPanel
title: "src/components/FansPanel.tsx"
layer: frontend
domain: social
file: "src/components/FansPanel.tsx"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/FansPanel.tsx

> **Ubicación:** `src/components/FansPanel.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Exporta: FansPanel.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*
- [[src_components_FansLandingPreviewModal|src/components/FansLandingPreviewModal.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_QrExportModal|src/components/QrExportModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModuleTutorialModal|src/components/common/ModuleTutorialModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModuleTutorialTrigger|src/components/common/ModuleTutorialTrigger.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_fans_FansCommunityView|src/components/fans/FansCommunityView.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_FansDashboardView|src/components/fans/FansDashboardView.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_qr_CustomizableBandQr|src/components/fans/qr/CustomizableBandQr.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_qr_QrCustomizerControls|src/components/fans/qr/QrCustomizerControls.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_qr_qrCustomizationConfig|src/components/fans/qr/qrCustomizationConfig.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_ReelsMetricsView|src/components/reels/ReelsMetricsView.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_ui_Onda|src/components/ui/Onda.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_Tabs|src/components/ui/Tabs.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_i18n_fansTranslations|src/i18n/fansTranslations.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bandHash|src/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_qrExport|src/utils/qrExport.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_theme|src/utils/theme.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
