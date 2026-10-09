---
id: src_components_repertorio_hooks_useSetlistItemActions
title: "src/components/repertorio/hooks/useSetlistItemActions.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/hooks/useSetlistItemActions.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/hooks/useSetlistItemActions.ts

> **Ubicación:** `src/components/repertorio/hooks/useSetlistItemActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Acciones sobre los items del setlist activo: añadir canciones y bloques, atajos personalizados, notas, asignación a conciertos e impresión de escenario.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_repertorioPdf|src/utils/repertorioPdf.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
