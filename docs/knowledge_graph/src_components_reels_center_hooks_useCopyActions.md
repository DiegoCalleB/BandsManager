---
id: src_components_reels_center_hooks_useCopyActions
title: "src/components/reels_center/hooks/useCopyActions.ts"
layer: frontend
domain: social
file: "src/components/reels_center/hooks/useCopyActions.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/hooks/useCopyActions.ts

> **Ubicación:** `src/components/reels_center/hooks/useCopyActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Genera, edita, copia y programa el texto del reel para cada plataforma.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_chat|server/routes/chat.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_reelsUtils|src/utils/reelsUtils.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_hooks_useReelsCenterController|src/components/reels_center/hooks/useReelsCenterController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
