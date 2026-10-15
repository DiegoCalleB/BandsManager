---
id: src_components_repertorio_setlistItemKind
title: "src/components/repertorio/setlistItemKind.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/setlistItemKind.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/setlistItemKind.ts

> **Ubicación:** `src/components/repertorio/setlistItemKind.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tipo de elemento que se puede añadir a un setlist desde los atajos y el editor: una canción,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_hooks_useSetlistItemActions|src/components/repertorio/hooks/useSetlistItemActions.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistItemsMutations|src/components/repertorio/hooks/useSetlistItemsMutations.ts]] *(from #frontend)*
- [[src_components_repertorio_RepertorioSetlistsView|src/components/repertorio/RepertorioSetlistsView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
