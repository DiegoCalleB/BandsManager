---
id: src_utils_formatSongTitle
title: "src/utils/formatSongTitle.ts"
layer: service
domain: repertoire
file: "src/utils/formatSongTitle.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/formatSongTitle.ts

> **Ubicación:** `src/utils/formatSongTitle.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: formatSongTitle, normalizeSongTitlesInList.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilHeader|src/components/atril/AtrilHeader.tsx]] *(from #frontend)*
- [[src_components_ensayos_OrdenDelDiaTab|src/components/ensayos/OrdenDelDiaTab.tsx]] *(from #frontend)*
- [[src_components_repertorio_AddSongsToSetlistModal|src/components/repertorio/AddSongsToSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_AssignSongsToAlbumModal|src/components/repertorio/AssignSongsToAlbumModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_EscenarioView|src/components/repertorio/EscenarioView.tsx]] *(from #frontend)*
- [[src_components_repertorio_hooks_useCatalogActions|src/components/repertorio/hooks/useCatalogActions.ts]] *(from #frontend)*
- [[src_components_repertorio_MemberNotesModal|src/components/repertorio/MemberNotesModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistAddBar|src/components/repertorio/SetlistAddBar.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistSongRow|src/components/repertorio/SetlistSongRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongModal|src/components/repertorio/SongModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioHeader|src/components/song_studio/SongStudioHeader.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/formatSongTitle.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
