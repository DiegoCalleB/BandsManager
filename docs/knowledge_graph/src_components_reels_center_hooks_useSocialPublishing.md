---
id: src_components_reels_center_hooks_useSocialPublishing
title: "src/components/reels_center/hooks/useSocialPublishing.ts"
layer: frontend
domain: social
file: "src/components/reels_center/hooks/useSocialPublishing.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/hooks/useSocialPublishing.ts

> **Ubicación:** `src/components/reels_center/hooks/useSocialPublishing.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Cuentas sociales conectadas y publicación directa del clip.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_posts|server/routes/posts.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_hooks_useReelsCenterController|src/components/reels_center/hooks/useReelsCenterController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
