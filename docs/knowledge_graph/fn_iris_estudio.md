---
id: fn_iris_estudio
title: "Estudio de canción e Iris (stems)"
layer: feature
domain: repertoire
file: "src/components/SongStudioModal.tsx"
tags: ["feature", "repertoire", "auto"]
---

# 📌 Estudio de canción e Iris (stems)

> **Ubicación:** `src/components/SongStudioModal.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Separación de pistas, mezcla, ideas de audio y descarga desde el estudio de canción.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[ext_replicate|Replicate]] *(Layer: #external, Domain: #system)*
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(Layer: #db, Domain: #repertoire)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_stemStorageRetryQueue|server/services/stemStorageRetryQueue.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_utils_separacionIris|src/utils/separacionIris.ts]] *(Layer: #service, Domain: #repertoire)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_song_stems_cache|tabla song_stems_cache]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_stem_prediction_jobs|tabla stem_prediction_jobs]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_stem_storage_retry_queue|tabla stem_storage_retry_queue]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
