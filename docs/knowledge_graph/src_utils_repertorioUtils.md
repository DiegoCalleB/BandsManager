---
id: src_utils_repertorioUtils
title: "src/utils/repertorioUtils.ts"
layer: service
domain: system
file: "src/utils/repertorioUtils.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/repertorioUtils.ts

> **Ubicación:** `src/utils/repertorioUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Song & Setlist calculation utilities

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_ensayos_OrdenDelDiaTab|src/components/ensayos/OrdenDelDiaTab.tsx]] *(from #frontend)*
- [[src_components_repertorio_AddSongsToSetlistModal|src/components/repertorio/AddSongsToSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_hooks_useBandRepertoireScope|src/components/repertorio/hooks/useBandRepertoireScope.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistSync|src/components/repertorio/hooks/useSetlistSync.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSongEditing|src/components/repertorio/hooks/useSongEditing.ts]] *(from #frontend)*
- [[src_components_repertorio_MemberNotesModal|src/components/repertorio/MemberNotesModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_PdfExportModal|src/components/repertorio/PdfExportModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistItemsList|src/components/repertorio/SetlistItemsList.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistShowItemRow|src/components/repertorio/SetlistShowItemRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistSongRow|src/components/repertorio/SetlistSongRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongModal|src/components/repertorio/SongModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioReadinessSelect|src/components/song_studio/SongStudioReadinessSelect.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioToolsMenu|src/components/song_studio/SongStudioToolsMenu.tsx]] *(from #frontend)*
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(from #service)*
- [[src_utils_repertorioPdf|src/utils/repertorioPdf.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/repertorioPdf.test.ts`
- `src/utils/__tests__/repertorioUtils.test.ts`
- `src/utils/__tests__/songMarkedForMember.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
