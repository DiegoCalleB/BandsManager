---
id: server_services_audioSeparator_AudioSeparatorService
title: "server/services/audioSeparator/AudioSeparatorService.ts"
layer: service
domain: repertoire
file: "server/services/audioSeparator/AudioSeparatorService.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/audioSeparator/AudioSeparatorService.ts

> **Ubicación:** `server/services/audioSeparator/AudioSeparatorService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: AudioSeparatorOptions, AudioSeparatorResult, AudioSeparatorJobStatus.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_stemStorageRetryQueue|server/services/stemStorageRetryQueue.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_audioSeparator_AudioSeparatorFactory|server/services/audioSeparator/AudioSeparatorFactory.ts]] *(from #service)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(from #service)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(from #service)*
- [[server_services_audioSeparator_LalalAiService|server/services/audioSeparator/LalalAiService.ts]] *(from #service)*
- [[server_services_audioSeparator_LocalDspService|server/services/audioSeparator/LocalDspService.ts]] *(from #service)*
- [[server_services_audioSeparator_ReplicateService|server/services/audioSeparator/ReplicateService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
