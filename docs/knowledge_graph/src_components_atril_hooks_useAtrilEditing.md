---
id: src_components_atril_hooks_useAtrilEditing
title: "src/components/atril/hooks/useAtrilEditing.ts"
layer: frontend
domain: repertoire
file: "src/components/atril/hooks/useAtrilEditing.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/hooks/useAtrilEditing.ts

> **Ubicación:** `src/components/atril/hooks/useAtrilEditing.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Edición del cifrado: corrección de acordes, generación con IA y guardado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_guardarConReversion|src/utils/guardarConReversion.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_hooks_useAtrilController|src/components/atril/hooks/useAtrilController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
