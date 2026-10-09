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
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
