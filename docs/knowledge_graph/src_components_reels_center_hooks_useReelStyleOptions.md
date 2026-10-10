---
id: src_components_reels_center_hooks_useReelStyleOptions
title: "src/components/reels_center/hooks/useReelStyleOptions.ts"
layer: frontend
domain: social
file: "src/components/reels_center/hooks/useReelStyleOptions.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/hooks/useReelStyleOptions.ts

> **Ubicación:** `src/components/reels_center/hooks/useReelStyleOptions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Opciones de estilo del clip (loop, zoom, subtítulos, pegatinas, layout) y piloto automático mágico.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_reelsUtils|src/utils/reelsUtils.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_hooks_useReelsCenterController|src/components/reels_center/hooks/useReelsCenterController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
