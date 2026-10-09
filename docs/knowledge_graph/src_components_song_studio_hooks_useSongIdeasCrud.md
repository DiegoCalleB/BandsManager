---
id: src_components_song_studio_hooks_useSongIdeasCrud
title: "src/components/song_studio/hooks/useSongIdeasCrud.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useSongIdeasCrud.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useSongIdeasCrud.ts

> **Ubicación:** `src/components/song_studio/hooks/useSongIdeasCrud.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
CRUD de ideas de audio: guardar, crear, votar, borrar, duplicar y borrar comentarios

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_studioConstants|src/components/song_studio/studioConstants.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_accompanimentSynth|src/utils/accompanimentSynth.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
