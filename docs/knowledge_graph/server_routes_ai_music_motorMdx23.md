---
id: server_routes_ai_music_motorMdx23
title: "server/routes/ai_music/motorMdx23.ts"
layer: route
domain: system
file: "server/routes/ai_music/motorMdx23.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/motorMdx23.ts

> **Ubicación:** `server/routes/ai_music/motorMdx23.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Motor MVSEP-MDX23 (MDX-Net + Demucs4) en Replicate.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_replicate|Replicate]] *(Layer: #external, Domain: #system)*
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_diagnosticos|server/routes/ai_music/diagnosticos.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_modelos|server/routes/ai_music/modelos.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_ai_music_motoresNeuronales|server/routes/ai_music/motoresNeuronales.ts]] *(from #route)*
- [[server_routes_ai_music_separacionMotores|server/routes/ai_music/separacionMotores.ts]] *(from #route)*
- [[server_services_audioSeparator_ReplicateService|server/services/audioSeparator/ReplicateService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
