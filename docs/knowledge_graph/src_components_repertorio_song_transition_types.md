---
id: src_components_repertorio_song_transition_types
title: "src/components/repertorio/song_transition/types.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/song_transition/types.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/song_transition/types.ts

> **Ubicación:** `src/components/repertorio/song_transition/types.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tipos compartidos de la comprobación de transición entre dos temas del repertorio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_song_transition_hooks_useSongTransitionController|src/components/repertorio/song_transition/hooks/useSongTransitionController.ts]] *(from #frontend)*
- [[src_components_repertorio_song_transition_hooks_useTransitionCues|src/components/repertorio/song_transition/hooks/useTransitionCues.ts]] *(from #frontend)*
- [[src_components_repertorio_song_transition_hooks_useTransitionPlayback|src/components/repertorio/song_transition/hooks/useTransitionPlayback.ts]] *(from #frontend)*
- [[src_components_repertorio_song_transition_hooks_useTransitionSources|src/components/repertorio/song_transition/hooks/useTransitionSources.ts]] *(from #frontend)*
- [[src_components_repertorio_song_transition_SongTransitionContext|src/components/repertorio/song_transition/SongTransitionContext.ts]] *(from #frontend)*
- [[src_components_repertorio_song_transition_TransitionTrackCard|src/components/repertorio/song_transition/TransitionTrackCard.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
