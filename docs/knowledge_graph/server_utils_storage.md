---
id: server_utils_storage
title: "server/utils/storage.ts"
layer: service
domain: system
file: "server/utils/storage.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/storage.ts

> **Ubicación:** `server/utils/storage.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Subida a Supabase Storage, en un solo sitio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(from #route)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(from #route)*
- [[server_routes_ai_music_generacionMusical|server/routes/ai_music/generacionMusical.ts]] *(from #route)*
- [[server_routes_ai_music_motoresNeuronales|server/routes/ai_music/motoresNeuronales.ts]] *(from #route)*
- [[server_routes_ai_music_motorFfmpeg|server/routes/ai_music/motorFfmpeg.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(from #service)*
- [[server_services_audioTransposeService|server/services/audioTransposeService.ts]] *(from #service)*
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*
- [[server_services_stemStorageRetryQueue|server/services/stemStorageRetryQueue.ts]] *(from #service)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/storage.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
