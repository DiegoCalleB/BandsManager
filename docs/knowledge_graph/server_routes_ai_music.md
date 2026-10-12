---
id: server_routes_ai_music
title: "server/routes/ai_music.ts"
layer: route
domain: system
file: "server/routes/ai_music.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music.ts

> **Ubicación:** `server/routes/ai_music.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
AI Music & Sound Studio: generación de pistas/jingles, separación de stems (Replicate/fal, con

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_diagnosticos|server/routes/ai_music/diagnosticos.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_diagnosticosInfra|server/routes/ai_music/diagnosticosInfra.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_modelos|server/routes/ai_music/modelos.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motorDemucs|server/routes/ai_music/motorDemucs.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motorFfmpeg|server/routes/ai_music/motorFfmpeg.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motorMdx23|server/routes/ai_music/motorMdx23.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motoresNeuronales|server/routes/ai_music/motoresNeuronales.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_rutaSeparacion|server/routes/ai_music/rutaSeparacion.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_rutasEstadoStems|server/routes/ai_music/rutasEstadoStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_rutasGeneracion|server/routes/ai_music/rutasGeneracion.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_rutasWebhooks|server/routes/ai_music/rutasWebhooks.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server|server.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/auditoriaSeguridadPR2.test.ts`
- `server/routes/__tests__/roformerStems.test.ts`
- `server/routes/__tests__/separacionStems.test.ts`
- `server/routes/__tests__/superficieUsersAiMusic.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
