---
id: server_routes_reelsProgramacion
title: "server/routes/reelsProgramacion.ts"
layer: route
domain: social
file: "server/routes/reelsProgramacion.ts"
tags: ["route", "social", "auto"]
---

# 📌 server/routes/reelsProgramacion.ts

> **Ubicación:** `server/routes/reelsProgramacion.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/social`

## 📖 Descripción
Reels · programación: el próximo hueco que respeta la cadencia de la banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_reelClips|server/db/reelClips.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_schedule|server/db/schedule.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_social|server/db/social.ts]] *(Layer: #db, Domain: #social)*
- [[server_services_youtubeMeta|server/services/youtubeMeta.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_cadenciaReels|server/utils/cadenciaReels.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/reelsProgramacion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
