---
id: src_components_repertorio_song_transition_SongTransitionView
title: "src/components/repertorio/song_transition/SongTransitionView.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/song_transition/SongTransitionView.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/song_transition/SongTransitionView.tsx

> **Ubicación:** `src/components/repertorio/song_transition/SongTransitionView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Vista de la comprobación de transición: compone cabecera, pistas, reproductor, diagnóstico y pie.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_song_transition_SongTransitionContext|src/components/repertorio/song_transition/SongTransitionContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_TransitionDiagnosisPanel|src/components/repertorio/song_transition/TransitionDiagnosisPanel.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_TransitionFooter|src/components/repertorio/song_transition/TransitionFooter.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_TransitionHeader|src/components/repertorio/song_transition/TransitionHeader.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_TransitionPlayer|src/components/repertorio/song_transition/TransitionPlayer.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_TransitionTrackCard|src/components/repertorio/song_transition/TransitionTrackCard.tsx]] *(Layer: #frontend, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
