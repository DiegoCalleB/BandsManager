---
id: src_components_repertorio_hooks_useCatalogActions
title: "src/components/repertorio/hooks/useCatalogActions.ts"
layer: frontend
domain: system
file: "src/components/repertorio/hooks/useCatalogActions.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/hooks/useCatalogActions.ts

> **Ubicación:** `src/components/repertorio/hooks/useCatalogActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Acciones del catálogo: selección múltiple, borrado masivo, álbumes y normalización de títulos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_guardarConReversion|src/utils/guardarConReversion.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
