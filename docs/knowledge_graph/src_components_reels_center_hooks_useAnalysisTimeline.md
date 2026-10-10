---
id: src_components_reels_center_hooks_useAnalysisTimeline
title: "src/components/reels_center/hooks/useAnalysisTimeline.ts"
layer: frontend
domain: social
file: "src/components/reels_center/hooks/useAnalysisTimeline.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/hooks/useAnalysisTimeline.ts

> **Ubicación:** `src/components/reels_center/hooks/useAnalysisTimeline.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Estado del análisis, metadatos de YouTube, línea de tiempo interactiva y simulación de reproducción.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[server_routes_reels|server/routes/reels.ts]] *(Layer: #route, Domain: #social)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_reelsHelpers|src/components/reels_center/reelsHelpers.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_reelsUtils|src/utils/reelsUtils.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_hooks_useReelsCenterController|src/components/reels_center/hooks/useReelsCenterController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
