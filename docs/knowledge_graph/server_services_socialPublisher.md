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
Exporta: PublishResult, publishSocialPostNow, publishDueScheduledPosts.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_social|server/db/social.ts]] *(Layer: #db, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_routes_posts|server/routes/posts.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
