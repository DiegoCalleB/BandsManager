---
id: server_routes_ai_music_rutasGeneracion
title: "server/routes/ai_music/rutasGeneracion.ts"
layer: route
domain: system
file: "server/routes/ai_music/rutasGeneracion.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/rutasGeneracion.ts

> **Ubicación:** `server/routes/ai_music/rutasGeneracion.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Rutas de generación musical: pistas/jingles completos y pista de un instrumento.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_ai_music_detalleTecnico|server/routes/ai_music/detalleTecnico.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_diagnosticosInfra|server/routes/ai_music/diagnosticosInfra.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_generacionMusical|server/routes/ai_music/generacionMusical.ts]] *(Layer: #route, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
