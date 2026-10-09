---
id: src_components_repertorio_SetlistItemsList
title: "src/components/repertorio/SetlistItemsList.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/SetlistItemsList.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/SetlistItemsList.tsx

> **Ubicación:** `src/components/repertorio/SetlistItemsList.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SetlistItemsListProps, SetlistItemsList.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_SetlistShowItemRow|src/components/repertorio/SetlistShowItemRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistSongRow|src/components/repertorio/SetlistSongRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/__tests__/SetlistItemsListContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
