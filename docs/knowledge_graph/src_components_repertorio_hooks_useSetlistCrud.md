---
id: src_components_repertorio_hooks_useSetlistCrud
title: "src/components/repertorio/hooks/useSetlistCrud.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/hooks/useSetlistCrud.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/hooks/useSetlistCrud.ts

> **Ubicación:** `src/components/repertorio/hooks/useSetlistCrud.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Crear, importar, guardar, duplicar y borrar setlists.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_guardarConReversion|src/utils/guardarConReversion.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
