---
id: fn_reels_social
title: "Reels y redes sociales"
layer: feature
domain: social
file: "src/components/ReelsCenter.tsx"
tags: ["feature", "social", "auto"]
---

# 📌 Reels y redes sociales

> **Ubicación:** `src/components/ReelsCenter.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/social`

## 📖 Descripción
Generación de reels virales, publicaciones y plan de crecimiento.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_reelAnalyses|server/db/reelAnalyses.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_social|server/db/social.ts]] *(Layer: #db, Domain: #social)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_posts|server/routes/posts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_reels|server/routes/reels.ts]] *(Layer: #route, Domain: #social)*
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(Layer: #frontend, Domain: #social)*
- [[tabla_reel_analyses|tabla reel_analyses]] *(Layer: #schema, Domain: #social)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
