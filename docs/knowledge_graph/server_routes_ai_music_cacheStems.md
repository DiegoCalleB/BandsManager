---
id: server_routes_ai_music_cacheStems
title: "server/routes/ai_music/cacheStems.ts"
layer: route
domain: repertoire
file: "server/routes/ai_music/cacheStems.ts"
tags: ["route", "repertoire", "auto"]
---

# 📌 server/routes/ai_music/cacheStems.ts

> **Ubicación:** `server/routes/ai_music/cacheStems.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Caché en memoria de stems, deduplicación de separaciones en curso, transcodificación a MP3 y persistencia de los stems crudos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_routes_ai_music_diagnosticos|server/routes/ai_music/diagnosticos.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_ffmpegConfigurado|server/routes/ai_music/ffmpegConfigurado.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_stemStorageRetryQueue|server/services/stemStorageRetryQueue.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(from #route)*
- [[server_routes_ai_music_motorDemucs|server/routes/ai_music/motorDemucs.ts]] *(from #route)*
- [[server_routes_ai_music_motoresNeuronales|server/routes/ai_music/motoresNeuronales.ts]] *(from #route)*
- [[server_routes_ai_music_motorMdx23|server/routes/ai_music/motorMdx23.ts]] *(from #route)*
- [[server_routes_ai_music_rutaSeparacion|server/routes/ai_music/rutaSeparacion.ts]] *(from #route)*
- [[server_routes_ai_music_separacionMotores|server/routes/ai_music/separacionMotores.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
