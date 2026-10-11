---
id: src_components_repertorio_hooks_useSongEditing
title: "src/components/repertorio/hooks/useSongEditing.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/hooks/useSongEditing.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/hooks/useSongEditing.ts

> **Ubicación:** `src/components/repertorio/hooks/useSongEditing.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Edición de canciones: análisis automático de acordes, guardado desde el formulario y borrado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_analisisAcordesCliente|src/utils/analisisAcordesCliente.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_guardarConReversion|src/utils/guardarConReversion.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_stageTimeFormat|src/utils/stageTimeFormat.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
