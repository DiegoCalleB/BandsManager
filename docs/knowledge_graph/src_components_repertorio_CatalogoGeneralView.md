---
id: src_components_repertorio_CatalogoGeneralView
title: "src/components/repertorio/CatalogoGeneralView.tsx"
layer: frontend
domain: system
file: "src/components/repertorio/CatalogoGeneralView.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/CatalogoGeneralView.tsx

> **Ubicación:** `src/components/repertorio/CatalogoGeneralView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: CatalogoGeneralViewProps, CatalogoGeneralView.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_AlbumCover|src/components/AlbumCover.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_CatalogoTabContentView|src/components/repertorio/CatalogoTabContentView.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/__tests__/CatalogoGeneralViewContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
