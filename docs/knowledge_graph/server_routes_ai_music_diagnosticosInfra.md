---
id: server_routes_ai_music_diagnosticosInfra
title: "server/routes/ai_music/diagnosticosInfra.ts"
layer: route
domain: system
file: "server/routes/ai_music/diagnosticosInfra.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/diagnosticosInfra.ts

> **Ubicación:** `server/routes/ai_music/diagnosticosInfra.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Diagnóstico de los errores de Gemini, FFmpeg y Supabase Storage para la separación de stems.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[server_routes_ai_music_diagnosticos|server/routes/ai_music/diagnosticos.ts]] *(Layer: #route, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_ai_music_rutasGeneracion|server/routes/ai_music/rutasGeneracion.ts]] *(from #route)*
- [[server_routes_ai_music_separacionContexto|server/routes/ai_music/separacionContexto.ts]] *(from #route)*
- [[server_routes_ai_music_separacionMotores|server/routes/ai_music/separacionMotores.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
