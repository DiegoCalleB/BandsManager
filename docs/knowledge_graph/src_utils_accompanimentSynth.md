---
id: src_utils_accompanimentSynth
title: "src/utils/accompanimentSynth.ts"
layer: service
domain: system
file: "src/utils/accompanimentSynth.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/accompanimentSynth.ts

> **Ubicación:** `src/utils/accompanimentSynth.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
WEBAUDIO SYNTHESIZER FOR AI DRUMS AND BASS REFERENCE ACCOMPANIMENT

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioBufferToWav|src/utils/audioBufferToWav.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_song_studio_hooks_useSongIdeasCrud|src/components/song_studio/hooks/useSongIdeasCrud.ts]] *(from #frontend)*
- [[src_hooks_useAccompanimentGenerator|src/hooks/useAccompanimentGenerator.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
