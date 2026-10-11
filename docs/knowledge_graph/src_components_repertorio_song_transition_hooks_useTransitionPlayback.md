---
id: src_components_repertorio_song_transition_hooks_useTransitionPlayback
title: "src/components/repertorio/song_transition/hooks/useTransitionPlayback.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/song_transition/hooks/useTransitionPlayback.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/song_transition/hooks/useTransitionPlayback.ts

> **Ubicación:** `src/components/repertorio/song_transition/hooks/useTransitionPlayback.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Reproducción de la unión: dos `<audio>` sincronizados por la línea de tiempo, o síntesis.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_song_transition_types|src/components/repertorio/song_transition/types.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioCueDetector|src/utils/audioCueDetector.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_transitionSynthesizer|src/utils/transitionSynthesizer.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_song_transition_hooks_useSongTransitionController|src/components/repertorio/song_transition/hooks/useSongTransitionController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
