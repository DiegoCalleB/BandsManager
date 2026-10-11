---
id: server_routes_ai_music_generacionMusical
title: "server/routes/ai_music/generacionMusical.ts"
layer: route
domain: system
file: "server/routes/ai_music/generacionMusical.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/generacionMusical.ts

> **Ubicación:** `server/routes/ai_music/generacionMusical.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Generación de música con Lyria (Gemini) y MusicGen (Replicate).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[ext_replicate|Replicate]] *(Layer: #external, Domain: #system)*
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_diagnosticos|server/routes/ai_music/diagnosticos.ts]] *(Layer: #route, Domain: #system)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music_rutasGeneracion|server/routes/ai_music/rutasGeneracion.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
