---
id: server_routes_ai_music_audioPublico
title: "server/routes/ai_music/audioPublico.ts"
layer: route
domain: repertoire
file: "server/routes/ai_music/audioPublico.ts"
tags: ["route", "repertoire", "auto"]
---

# 📌 server/routes/ai_music/audioPublico.ts

> **Ubicación:** `server/routes/ai_music/audioPublico.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Prepara el audio de un tema para los proveedores externos: URL pública verificada y versión comprimida para Replicate.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_formatoStems|server/routes/ai_music/formatoStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_ai_music_generacionMusical|server/routes/ai_music/generacionMusical.ts]] *(from #route)*
- [[server_routes_ai_music_motorDemucs|server/routes/ai_music/motorDemucs.ts]] *(from #route)*
- [[server_routes_ai_music_motoresNeuronales|server/routes/ai_music/motoresNeuronales.ts]] *(from #route)*
- [[server_routes_ai_music_motorMdx23|server/routes/ai_music/motorMdx23.ts]] *(from #route)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
