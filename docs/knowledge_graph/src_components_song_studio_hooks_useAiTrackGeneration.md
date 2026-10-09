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
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
