---
id: src_components_repertorio_DiscografiaView
title: "src/components/repertorio/DiscografiaView.tsx"
layer: frontend
domain: system
file: "src/components/repertorio/DiscografiaView.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/DiscografiaView.tsx

> **Ubicación:** `src/components/repertorio/DiscografiaView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: DiscografiaView.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_AlbumCover|src/components/AlbumCover.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_ExportAlbumSongsModal|src/components/repertorio/ExportAlbumSongsModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_LiveConcertToAlbumModal|src/components/repertorio/LiveConcertToAlbumModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SpotifyDiscographyModal|src/components/repertorio/SpotifyDiscographyModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useColaLetras|src/hooks/useColaLetras.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_transcripcionMasiva|src/utils/transcripcionMasiva.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_CatalogoTabContentView|src/components/repertorio/CatalogoTabContentView.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
