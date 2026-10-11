---
id: server_services_audioSeparator_LocalDspService
title: "server/services/audioSeparator/LocalDspService.ts"
layer: service
domain: repertoire
file: "server/services/audioSeparator/LocalDspService.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/audioSeparator/LocalDspService.ts

> **Ubicación:** `server/services/audioSeparator/LocalDspService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: LocalDspService.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[server_routes_ai_music_motorFfmpeg|server/routes/ai_music/motorFfmpeg.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_audioSeparator_AudioSeparatorFactory|server/services/audioSeparator/AudioSeparatorFactory.ts]] *(from #service)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
