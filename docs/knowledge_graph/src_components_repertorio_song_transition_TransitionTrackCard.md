---
id: src_components_repertorio_song_transition_TransitionTrackCard
title: "src/components/repertorio/song_transition/TransitionTrackCard.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/song_transition/TransitionTrackCard.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/song_transition/TransitionTrackCard.tsx

> **Ubicación:** `src/components/repertorio/song_transition/TransitionTrackCard.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tarjeta de una pista: tono, BPM, energía, CUE detectados, fuente de audio y vúmetro.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_song_transition_SongTransitionContext|src/components/repertorio/song_transition/SongTransitionContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_transitionFormat|src/components/repertorio/song_transition/transitionFormat.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_types|src/components/repertorio/song_transition/types.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_song_transition_SongTransitionView|src/components/repertorio/song_transition/SongTransitionView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
