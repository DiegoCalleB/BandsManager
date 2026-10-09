---
id: src_components_song_studio_hooks_useIdeaPlaybackTracks
title: "src/components/song_studio/hooks/useIdeaPlaybackTracks.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useIdeaPlaybackTracks.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useIdeaPlaybackTracks.ts

> **Ubicación:** `src/components/song_studio/hooks/useIdeaPlaybackTracks.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Pistas que suenan de una idea: las propias más las pistas base virtuales de la canción

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
