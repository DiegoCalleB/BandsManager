---
id: src_components_repertorio_song_transition_hooks_useTransitionSources
title: "src/components/repertorio/song_transition/hooks/useTransitionSources.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/song_transition/hooks/useTransitionSources.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/song_transition/hooks/useTransitionSources.ts

> **Ubicación:** `src/components/repertorio/song_transition/hooks/useTransitionSources.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Fuentes de audio de las dos pistas: maqueta del tema, audio subido a mano o muestra de estudio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_song_transition_types|src/components/repertorio/song_transition/types.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_song_transition_hooks_useSongTransitionController|src/components/repertorio/song_transition/hooks/useSongTransitionController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
