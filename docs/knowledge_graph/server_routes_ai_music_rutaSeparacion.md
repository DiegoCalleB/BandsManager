---
id: server_routes_ai_music_rutaSeparacion
title: "server/routes/ai_music/rutaSeparacion.ts"
layer: route
domain: system
file: "server/routes/ai_music/rutaSeparacion.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/rutaSeparacion.ts

> **Ubicación:** `server/routes/ai_music/rutaSeparacion.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
POST /ai-stem-separation: separa un tema en stems (voz, batería, bajo…) con el motor pedido.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(Layer: #db, Domain: #repertoire)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_formatoStems|server/routes/ai_music/formatoStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_separacionContexto|server/routes/ai_music/separacionContexto.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_separacionMotores|server/routes/ai_music/separacionMotores.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[src_utils_tiposSeparacionIris|src/utils/tiposSeparacionIris.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
