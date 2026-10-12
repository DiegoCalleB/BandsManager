---
id: src_components_repertorio_song_transition_SongTransitionContext
title: "src/components/repertorio/song_transition/SongTransitionContext.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/song_transition/SongTransitionContext.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/song_transition/SongTransitionContext.ts

> **Ubicación:** `src/components/repertorio/song_transition/SongTransitionContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Contexto de la comprobación de transición: reparte el controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_song_transition_hooks_useSongTransitionController|src/components/repertorio/song_transition/hooks/useSongTransitionController.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_types|src/components/repertorio/song_transition/types.ts]] *(Layer: #frontend, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_song_transition_SongTransitionProvider|src/components/repertorio/song_transition/SongTransitionProvider.tsx]] *(from #frontend)*
- [[src_components_repertorio_song_transition_SongTransitionView|src/components/repertorio/song_transition/SongTransitionView.tsx]] *(from #frontend)*
- [[src_components_repertorio_song_transition_TransitionDiagnosisPanel|src/components/repertorio/song_transition/TransitionDiagnosisPanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_song_transition_TransitionFooter|src/components/repertorio/song_transition/TransitionFooter.tsx]] *(from #frontend)*
- [[src_components_repertorio_song_transition_TransitionHeader|src/components/repertorio/song_transition/TransitionHeader.tsx]] *(from #frontend)*
- [[src_components_repertorio_song_transition_TransitionPlayer|src/components/repertorio/song_transition/TransitionPlayer.tsx]] *(from #frontend)*
- [[src_components_repertorio_song_transition_TransitionTrackCard|src/components/repertorio/song_transition/TransitionTrackCard.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/song_transition/__tests__/songTransitionContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
