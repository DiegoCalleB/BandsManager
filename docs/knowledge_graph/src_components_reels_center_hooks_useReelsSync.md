---
id: src_components_reels_center_hooks_useReelsSync
title: "src/components/reels_center/hooks/useReelsSync.ts"
layer: frontend
domain: social
file: "src/components/reels_center/hooks/useReelsSync.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/hooks/useReelsSync.ts

> **Ubicación:** `src/components/reels_center/hooks/useReelsSync.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Sincroniza los reels publicados desde la hoja de cálculo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_posts|server/routes/posts.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_hooks_useReelsCenterController|src/components/reels_center/hooks/useReelsCenterController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
