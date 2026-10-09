---
id: src_components_ReelsCenter
title: "src/components/ReelsCenter.tsx"
layer: frontend
domain: social
file: "src/components/ReelsCenter.tsx"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/ReelsCenter.tsx

> **Ubicación:** `src/components/ReelsCenter.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Exporta: YoutubeVideoMeta, ReelsCenter.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_chat|server/routes/chat.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_posts|server/routes/posts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_reels|server/routes/reels.ts]] *(Layer: #route, Domain: #social)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_reels_ReelsPhoneMockup|src/components/reels/ReelsPhoneMockup.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_ReelsTheaterModal|src/components/reels/ReelsTheaterModal.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_ViralGrowthStudio|src/components/reels/ViralGrowthStudio.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_Tabs|src/components/ui/Tabs.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_reelsUtils|src/utils/reelsUtils.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
