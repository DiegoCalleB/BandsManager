---
id: server_services_socialPublisher
title: "server/services/socialPublisher.ts"
layer: service
domain: social
file: "server/services/socialPublisher.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/socialPublisher.ts

> **Ubicación:** `server/services/socialPublisher.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Publicación de posts sociales en las plataformas reales.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_db_reelClips|server/db/reelClips.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_schedule|server/db/schedule.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_social|server/db/social.ts]] *(Layer: #db, Domain: #social)*
- [[server_services_publicadores_instagramReels|server/services/publicadores/instagramReels.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_programacionPosts|server/utils/programacionPosts.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_posts|server/routes/posts.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/socialPublisher.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
