---
id: src_components_atril_AtrilModals
title: "src/components/atril/AtrilModals.tsx"
layer: frontend
domain: repertoire
file: "src/components/atril/AtrilModals.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/AtrilModals.tsx

> **Ubicación:** `src/components/atril/AtrilModals.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Modales del Atril: progreso de stems, compartir, metrónomo, afinador, oído y subida de estructura.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_MetronomeModal|src/components/MetronomeModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ShareModal|src/components/ShareModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_TunerModal|src/components/TunerModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_atril_AtrilContext|src/components/atril/AtrilContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ModalOido|src/components/chords/ModalOido.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioStemProgressModal|src/components/song_studio/SongStudioStemProgressModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioStructureUploadModal|src/components/song_studio/SongStudioStructureUploadModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_utils_shareUtils|src/utils/shareUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilView|src/components/atril/AtrilView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
