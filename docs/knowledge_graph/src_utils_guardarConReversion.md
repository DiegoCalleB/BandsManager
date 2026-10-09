---
id: src_utils_guardarConReversion
title: "src/utils/guardarConReversion.ts"
layer: service
domain: system
file: "src/utils/guardarConReversion.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/guardarConReversion.ts

> **Ubicación:** `src/utils/guardarConReversion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Guardado optimista con marcha atrás.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_repertorio_hooks_useCatalogActions|src/components/repertorio/hooks/useCatalogActions.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistCrud|src/components/repertorio/hooks/useSetlistCrud.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSongEditing|src/components/repertorio/hooks/useSongEditing.ts]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/guardarConReversion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
