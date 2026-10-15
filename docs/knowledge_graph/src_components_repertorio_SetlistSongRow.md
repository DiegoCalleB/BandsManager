---
id: src_components_repertorio_SetlistSongRow
title: "src/components/repertorio/SetlistSongRow.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/SetlistSongRow.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/SetlistSongRow.tsx

> **Ubicación:** `src/components/repertorio/SetlistSongRow.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SetlistSongRowProps, SetlistSongRow.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SetlistItemsList|src/components/repertorio/SetlistItemsList.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/__tests__/SetlistSongRowContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
