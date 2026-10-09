---
id: src_utils_musicTheory
title: "src/utils/musicTheory.ts"
layer: service
domain: system
file: "src/utils/musicTheory.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/musicTheory.ts

> **Ubicación:** `src/utils/musicTheory.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Conversión entre nombres de nota y números MIDI, en la convención de Tone.js: Do central =

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_melodicIdeaValidator|server/utils/melodicIdeaValidator.ts]] *(from #service)*
- [[src_utils_instrumentSynth|src/utils/instrumentSynth.ts]] *(from #service)*
- [[src_utils_midiExport|src/utils/midiExport.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
