---
id: server_routes_ai_music_motorFfmpeg
title: "server/routes/ai_music/motorFfmpeg.ts"
layer: route
domain: system
file: "server/routes/ai_music/motorFfmpeg.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/motorFfmpeg.ts

> **Ubicación:** `server/routes/ai_music/motorFfmpeg.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Motor DSP local con FFmpeg: separación por filtros de frecuencia, gratuita y sin GPU.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_routes_ai_music_ffmpegConfigurado|server/routes/ai_music/ffmpegConfigurado.ts]] *(Layer: #route, Domain: #system)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_rutaContenida|server/utils/rutaContenida.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_ai_music_separacionMotores|server/routes/ai_music/separacionMotores.ts]] *(from #route)*
- [[server_services_audioSeparator_LocalDspService|server/services/audioSeparator/LocalDspService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
