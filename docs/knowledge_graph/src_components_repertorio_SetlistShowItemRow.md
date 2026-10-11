---
id: src_components_repertorio_SetlistShowItemRow
title: "src/components/repertorio/SetlistShowItemRow.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/SetlistShowItemRow.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/SetlistShowItemRow.tsx

> **Ubicación:** `src/components/repertorio/SetlistShowItemRow.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SetlistShowItemRowProps, SetlistShowItemRow.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SetlistItemsList|src/components/repertorio/SetlistItemsList.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/__tests__/SetlistShowItemRowContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
