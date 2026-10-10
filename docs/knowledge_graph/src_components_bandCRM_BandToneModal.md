---
id: src_components_bandCRM_BandToneModal
title: "src/components/bandCRM/BandToneModal.tsx"
layer: frontend
domain: booking
file: "src/components/bandCRM/BandToneModal.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/BandToneModal.tsx

> **Ubicación:** `src/components/bandCRM/BandToneModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: ToneAnalysisData, BandToneModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_booking_ExampleThreadsSection|src/components/booking/ExampleThreadsSection.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_TemplateConfigSection|src/components/booking/TemplateConfigSection.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandCrmModalsHost|src/components/bandCRM/BandCrmModalsHost.tsx]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandCrmUiState|src/components/bandCRM/hooks/useBandCrmUiState.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandToneAnalysis|src/components/bandCRM/hooks/useBandToneAnalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useBandToneAnalysis|src/components/reels_center/hooks/useBandToneAnalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(from #frontend)*
- [[src_components_reels_center_ReelsCenterLayout|src/components/reels_center/ReelsCenterLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
