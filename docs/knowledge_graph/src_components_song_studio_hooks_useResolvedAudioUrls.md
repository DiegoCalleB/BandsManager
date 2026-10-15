---
id: src_components_song_studio_hooks_useResolvedAudioUrls
title: "src/components/song_studio/hooks/useResolvedAudioUrls.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useResolvedAudioUrls.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useResolvedAudioUrls.ts

> **Ubicación:** `src/components/song_studio/hooks/useResolvedAudioUrls.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Resolución asíncrona de las URLs de audio (firmadas o relativas) de todas las pistas de la canción

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
