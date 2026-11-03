---
id: server_utils_optimizarAudioSubido
title: "server/utils/optimizarAudioSubido.ts"
layer: service
domain: repertoire
file: "server/utils/optimizarAudioSubido.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/optimizarAudioSubido.ts

> **Ubicación:** `server/utils/optimizarAudioSubido.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Optimización transparente del audio que sube la banda: lo pesado (WAV, FLAC, AIFF...) se recodifica a

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_upload|server/routes/upload.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/optimizarAudioSubido.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
