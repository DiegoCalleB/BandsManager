---
id: server_routes_ai_music_ffmpegConfigurado
title: "server/routes/ai_music/ffmpegConfigurado.ts"
layer: route
domain: system
file: "server/routes/ai_music/ffmpegConfigurado.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/ffmpegConfigurado.ts

> **Ubicación:** `server/routes/ai_music/ffmpegConfigurado.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
FFmpeg con el binario de `ffmpeg-static` ya configurado. Todos los módulos de IA musical lo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(from #route)*
- [[server_routes_ai_music_motorFfmpeg|server/routes/ai_music/motorFfmpeg.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
