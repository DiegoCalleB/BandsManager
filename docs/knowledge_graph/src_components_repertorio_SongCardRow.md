---
id: src_components_repertorio_SongCardRow
title: "src/components/repertorio/SongCardRow.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/SongCardRow.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/SongCardRow.tsx

> **Ubicación:** `src/components/repertorio/SongCardRow.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SongCardRowProps, SongCardRow.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_posicionMenu|src/utils/posicionMenu.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_CatalogoGeneralView|src/components/repertorio/CatalogoGeneralView.tsx]] *(from #frontend)*
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
