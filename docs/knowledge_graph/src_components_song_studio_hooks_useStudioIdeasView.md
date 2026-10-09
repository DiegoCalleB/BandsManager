---
id: src_components_song_studio_hooks_useStudioIdeasView
title: "src/components/song_studio/hooks/useStudioIdeasView.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useStudioIdeasView.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useStudioIdeasView.ts

> **Ubicación:** `src/components/song_studio/hooks/useStudioIdeasView.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Vista derivada de las ideas de la canción: filtradas por sección, tomas, ideas de Iris y fuente de stems

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
