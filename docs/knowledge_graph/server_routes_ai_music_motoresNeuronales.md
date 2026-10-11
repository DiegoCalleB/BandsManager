---
id: server_routes_ai_music_motoresNeuronales
title: "server/routes/ai_music/motoresNeuronales.ts"
layer: route
domain: system
file: "server/routes/ai_music/motoresNeuronales.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/motoresNeuronales.ts

> **Ubicación:** `server/routes/ai_music/motoresNeuronales.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Separación neuronal combinada: Replicate (MDX23 con caída a Demucs) y Fal.ai.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_motorDemucs|server/routes/ai_music/motorDemucs.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motorMdx23|server/routes/ai_music/motorMdx23.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_ai_music_separacionMotores|server/routes/ai_music/separacionMotores.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
