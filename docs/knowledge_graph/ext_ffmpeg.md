---
id: ext_ffmpeg
title: "FFmpeg"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 FFmpeg

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Procesado de audio y vídeo en servidor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(from #security)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_upload|server/routes/upload.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(from #service)*
- [[server_services_audioSeparator_LocalDspService|server/services/audioSeparator/LocalDspService.ts]] *(from #service)*
- [[server_services_audioTransposeService|server/services/audioTransposeService.ts]] *(from #service)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(from #service)*
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(from #service)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(from #service)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(from #service)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(from #service)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(from #service)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(from #frontend)*
- [[src_utils_separacionIris|src/utils/separacionIris.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
