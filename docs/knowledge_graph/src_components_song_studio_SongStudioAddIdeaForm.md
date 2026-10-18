---
id: src_components_song_studio_SongStudioAddIdeaForm
title: "src/components/song_studio/SongStudioAddIdeaForm.tsx"
layer: frontend
domain: repertoire
file: "src/components/song_studio/SongStudioAddIdeaForm.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/SongStudioAddIdeaForm.tsx

> **Ubicación:** `src/components/song_studio/SongStudioAddIdeaForm.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Formulario de nueva idea de audio: fuente (tema base, archivo, micrófono, Drive o IA), pistas de Iris y acompañamiento

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_LiveMicWaveformCanvas|src/components/song_studio/LiveMicWaveformCanvas.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioContext|src/components/song_studio/SongStudioContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_studioConstants|src/components/song_studio/studioConstants.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_SongStudioContentBody|src/components/song_studio/SongStudioContentBody.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
