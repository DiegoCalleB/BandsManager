---
id: src_components_reels_center_hooks_useVideoAnalyzer
title: "src/components/reels_center/hooks/useVideoAnalyzer.ts"
layer: frontend
domain: social
file: "src/components/reels_center/hooks/useVideoAnalyzer.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/hooks/useVideoAnalyzer.ts

> **Ubicación:** `src/components/reels_center/hooks/useVideoAnalyzer.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Lanza el análisis IA del vídeo (YouTube o archivo local) y vuelca los highlights resultantes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
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
