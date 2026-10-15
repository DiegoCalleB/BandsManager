---
id: src_components_repertorio_song_transition_hooks_useSongTransitionController
title: "src/components/repertorio/song_transition/hooks/useSongTransitionController.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/song_transition/hooks/useSongTransitionController.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/song_transition/hooks/useSongTransitionController.ts

> **Ubicación:** `src/components/repertorio/song_transition/hooks/useSongTransitionController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Controlador de la comprobación de transición: compone diagnóstico, fuentes, Auto-CUE y reproducción.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_song_transition_hooks_useTransitionCues|src/components/repertorio/song_transition/hooks/useTransitionCues.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_hooks_useTransitionPlayback|src/components/repertorio/song_transition/hooks/useTransitionPlayback.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_hooks_useTransitionSources|src/components/repertorio/song_transition/hooks/useTransitionSources.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_types|src/components/repertorio/song_transition/types.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_song_transition_SongTransitionContext|src/components/repertorio/song_transition/SongTransitionContext.ts]] *(from #frontend)*
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
