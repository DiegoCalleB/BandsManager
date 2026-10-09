---
id: server_routes_ai_music
title: "server/routes/ai_music.ts"
layer: route
domain: system
file: "server/routes/ai_music.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music.ts

> **Ubicación:** `server/routes/ai_music.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
AI Music & Sound Studio: generación de pistas/jingles, separación de stems (Replicate/fal, con

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[ext_replicate|Replicate]] *(Layer: #external, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(Layer: #db, Domain: #repertoire)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_stemStorageRetryQueue|server/services/stemStorageRetryQueue.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(from #service)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(from #service)*
- [[server_services_audioSeparator_LocalDspService|server/services/audioSeparator/LocalDspService.ts]] *(from #service)*
- [[server_services_audioSeparator_ReplicateService|server/services/audioSeparator/ReplicateService.ts]] *(from #service)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/auditoriaSeguridadPR2.test.ts`
- `server/routes/__tests__/roformerStems.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
