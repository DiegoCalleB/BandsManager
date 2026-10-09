---
id: src_components_song_studio_hooks_useTrackMixerActions
title: "src/components/song_studio/hooks/useTrackMixerActions.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useTrackMixerActions.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useTrackMixerActions.ts

> **Ubicación:** `src/components/song_studio/hooks/useTrackMixerActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: TrackMixerActionsParams, useTrackMixerActions.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_trackColors|src/components/song_studio/trackColors.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
