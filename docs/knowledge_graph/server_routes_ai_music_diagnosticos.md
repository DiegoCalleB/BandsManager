---
id: server_routes_ai_music_diagnosticos
title: "server/routes/ai_music/diagnosticos.ts"
layer: route
domain: system
file: "server/routes/ai_music/diagnosticos.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/diagnosticos.ts

> **Ubicación:** `server/routes/ai_music/diagnosticos.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: MusicServiceErrorProvider, StemErrorType, ServiceDiagnosticError, ReplicateDiagnosticError, parseReplicateError, parseFalError, fetchReplicateWithRetry.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(from #route)*
- [[server_routes_ai_music_diagnosticosInfra|server/routes/ai_music/diagnosticosInfra.ts]] *(from #route)*
- [[server_routes_ai_music_generacionMusical|server/routes/ai_music/generacionMusical.ts]] *(from #route)*
- [[server_routes_ai_music_motorDemucs|server/routes/ai_music/motorDemucs.ts]] *(from #route)*
- [[server_routes_ai_music_motorMdx23|server/routes/ai_music/motorMdx23.ts]] *(from #route)*
- [[server_routes_ai_music_separacionContexto|server/routes/ai_music/separacionContexto.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
