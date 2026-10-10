---
id: src_components_song_studio_SongStudioStructureUploadModal
title: "src/components/song_studio/SongStudioStructureUploadModal.tsx"
layer: frontend
domain: repertoire
file: "src/components/song_studio/SongStudioStructureUploadModal.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/SongStudioStructureUploadModal.tsx

> **Ubicación:** `src/components/song_studio/SongStudioStructureUploadModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SongStudioStructureUploadModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_documentType|src/utils/documentType.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilModals|src/components/atril/AtrilModals.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
