---
id: src_components_song_studio_SongStudioDialogs
title: "src/components/song_studio/SongStudioDialogs.tsx"
layer: frontend
domain: repertoire
file: "src/components/song_studio/SongStudioDialogs.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/SongStudioDialogs.tsx

> **Ubicación:** `src/components/song_studio/SongStudioDialogs.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Diálogos secundarios del estudio: IA, Iris, acordes, atajos, borrado, compartir, ensayo, stems y progreso

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_Atril|src/components/Atril.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ShareModal|src/components/ShareModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_song_studio_SongStudioAiComposerModal|src/components/song_studio/SongStudioAiComposerModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioAiGeneratorModal|src/components/song_studio/SongStudioAiGeneratorModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioAiMusicModal|src/components/song_studio/SongStudioAiMusicModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioAiTrackGenModal|src/components/song_studio/SongStudioAiTrackGenModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioContext|src/components/song_studio/SongStudioContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioCubaseHelpModal|src/components/song_studio/SongStudioCubaseHelpModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioDeleteConfirmModal|src/components/song_studio/SongStudioDeleteConfirmModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIrisSheet|src/components/song_studio/SongStudioIrisSheet.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioMoisesStemsModal|src/components/song_studio/SongStudioMoisesStemsModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioStemProgressModal|src/components/song_studio/SongStudioStemProgressModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_SongStudioLayout|src/components/song_studio/SongStudioLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
