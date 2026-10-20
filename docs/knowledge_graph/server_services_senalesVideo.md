---
id: server_services_senalesVideo
title: "server/services/senalesVideo.ts"
layer: service
domain: system
file: "server/services/senalesVideo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/senalesVideo.ts

> **Ubicación:** `server/services/senalesVideo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Señales medidas sobre el vídeo real: volumen, contraste al arrancar y cambios de plano.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[server_services_interesDelPublico|server/services/interesDelPublico.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_youtubeMeta|server/services/youtubeMeta.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_ajusteDeCortes|server/utils/ajusteDeCortes.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/senalesVideo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
