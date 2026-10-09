---
id: src_utils_audioBufferToWav
title: "src/utils/audioBufferToWav.ts"
layer: service
domain: repertoire
file: "src/utils/audioBufferToWav.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/audioBufferToWav.ts

> **Ubicación:** `src/utils/audioBufferToWav.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Codificador PCM16 WAV compartido por los sintetizadores locales del chatbot y Song Studio

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_utils_accompanimentSynth|src/utils/accompanimentSynth.ts]] *(from #service)*
- [[src_utils_instrumentSynth|src/utils/instrumentSynth.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
