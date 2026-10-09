---
id: src_config_defaultRepertoire
title: "src/config/defaultRepertoire.ts"
layer: service
domain: repertoire
file: "src/config/defaultRepertoire.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/config/defaultRepertoire.ts

> **Ubicación:** `src/config/defaultRepertoire.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: BAKANDEYA_DEMO_MEMBERS, SHOW_ITEM_TYPES, TRANSPARENT_DRAG_IMAGE, DEFAULT_SONGS, DEFAULT_SETLISTS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SetlistShowItemRow|src/components/repertorio/SetlistShowItemRow.tsx]] *(from #frontend)*
- [[src_hooks_useRepertorioSync|src/hooks/useRepertorioSync.ts]] *(from #hook)*
- [[src_utils_repertorioPdf|src/utils/repertorioPdf.ts]] *(from #service)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
