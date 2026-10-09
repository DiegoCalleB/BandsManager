---
id: src_utils_ideaDeAtril
title: "src/utils/ideaDeAtril.ts"
layer: service
domain: repertoire
file: "src/utils/ideaDeAtril.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/ideaDeAtril.ts

> **Ubicación:** `src/utils/ideaDeAtril.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: DatosIdeaDeAtril, crearIdeaDeAtril, ideasCompatiblesConPistas, pistasBaseDeIdea, ideaConPistasBase, tomasDeCancion, pistasParaToma, ideasConFondo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_TomasConFondo|src/components/chords/TomasConFondo.tsx]] *(from #frontend)*
- [[src_components_song_studio_hooks_useIdeaPlaybackTracks|src/components/song_studio/hooks/useIdeaPlaybackTracks.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useSongIdeasCrud|src/components/song_studio/hooks/useSongIdeasCrud.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackMixerActions|src/components/song_studio/hooks/useTrackMixerActions.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaCard|src/components/song_studio/SongStudioIdeaCard.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioMixerTrackRow|src/components/song_studio/SongStudioMixerTrackRow.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioOverdubDrawer|src/components/song_studio/SongStudioOverdubDrawer.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/mezclaBaseIdea.test.ts`
- `src/utils/__tests__/ideaDeAtril.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
