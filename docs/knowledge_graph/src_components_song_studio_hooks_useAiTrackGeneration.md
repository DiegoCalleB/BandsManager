---
id: src_components_song_studio_hooks_useAiTrackGeneration
title: "src/components/song_studio/hooks/useAiTrackGeneration.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useAiTrackGeneration.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useAiTrackGeneration.ts

> **Ubicación:** `src/components/song_studio/hooks/useAiTrackGeneration.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Generador de pista de instrumento con IA y separación de stems con Iris: formularios, vista previa, generación y alta de la pista en la idea

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_studioConstants|src/components/song_studio/studioConstants.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
