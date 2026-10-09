---
id: src_utils_instrumentSynth
title: "src/utils/instrumentSynth.ts"
layer: service
domain: system
file: "src/utils/instrumentSynth.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/instrumentSynth.ts

> **Ubicación:** `src/utils/instrumentSynth.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
SINTETIZADOR TONE.JS PARA IDEAS MELÓDICAS DE IA POR INSTRUMENTO (GUITARRA, VIOLÍN, HANDPAN,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioBufferToWav|src/utils/audioBufferToWav.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_musicTheory|src/utils/musicTheory.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/instrumentSynth.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
