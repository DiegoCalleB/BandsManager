---
id: server_db_social
title: "server/db/social.ts"
layer: db
domain: social
file: "server/db/social.ts"
tags: ["db", "social", "auto"]
---

# 📌 server/db/social.ts

> **Ubicación:** `server/db/social.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/social`

## 📖 Descripción
Redes y contenido social: publicaciones, métricas, cuentas conectadas y piezas de contenido.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_band_social_accounts|tabla band_social_accounts]] *(Layer: #schema, Domain: #social)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_social_content_items|tabla social_content_items]] *(Layer: #schema, Domain: #social)*
- [[tabla_social_metrics|tabla social_metrics]] *(Layer: #schema, Domain: #social)*
- [[tabla_social_posts|tabla social_posts]] *(Layer: #schema, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
