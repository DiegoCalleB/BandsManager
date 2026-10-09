---
id: src_components_repertorio_hooks_useSetlistItemsMutations
title: "src/components/repertorio/hooks/useSetlistItemsMutations.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/hooks/useSetlistItemsMutations.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/hooks/useSetlistItemsMutations.ts

> **Ubicación:** `src/components/repertorio/hooks/useSetlistItemsMutations.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Mutaciones puras del setlist activo: aplicar cambios de items con snapshot de deshacer, reordenar, insertar y quitar elementos, sugerir chapa y optimizar transiciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
