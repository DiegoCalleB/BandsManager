---
id: server_utils_slug
title: "server/utils/slug.ts"
layer: service
domain: system
file: "server/utils/slug.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/slug.ts

> **Ubicación:** `server/utils/slug.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: slugify, generateUniqueSlugId.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*
- [[server_routes_users_rutasBandas|server/routes/users/rutasBandas.ts]] *(from #route)*
- [[server_routes_users_rutasGoogle|server/routes/users/rutasGoogle.ts]] *(from #route)*
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(from #route)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(from #route)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(from #service)*
- [[server_utils_seo_festivales_importar|server/utils/seo/festivales/importar.ts]] *(from #service)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
