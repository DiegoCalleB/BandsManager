---
id: server_routes_ai_music_rutasEstadoStems
title: "server/routes/ai_music/rutasEstadoStems.ts"
layer: route
domain: repertoire
file: "server/routes/ai_music/rutasEstadoStems.ts"
tags: ["route", "repertoire", "auto"]
---

# 📌 server/routes/ai_music/rutasEstadoStems.ts

> **Ubicación:** `server/routes/ai_music/rutasEstadoStems.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Estado de una separación de stems en segundo plano (polling) y diagnóstico de la conexión con Fal.ai.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(Layer: #db, Domain: #repertoire)*
- [[server_routes_ai_music_formatoStems|server/routes/ai_music/formatoStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
