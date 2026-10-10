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
Centro de Reels: pipeline de contenido y analizador de vídeo con IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_reels_center_ReelsCenterLayout|src/components/reels_center/ReelsCenterLayout.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_ReelsCenterProvider|src/components/reels_center/ReelsCenterProvider.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useReelsCenterController|src/components/reels_center/hooks/useReelsCenterController.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_reelsHelpers|src/components/reels_center/reelsHelpers.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_reelsUtils|src/utils/reelsUtils.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/components/reels_center/__tests__/reelsCenterContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
