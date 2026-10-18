---
id: src_utils_cartel_formatos
title: "src/utils/cartel/formatos.ts"
layer: service
domain: system
file: "src/utils/cartel/formatos.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/formatos.ts

> **Ubicación:** `src/utils/cartel/formatos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Formatos de salida. Un mismo diseño se recompone para cada uno: el layout trabaja en

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[src_components_cartel_CarteleriaView|src/components/cartel/CarteleriaView.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(from #service)*
- [[src_utils_cartel_layout|src/utils/cartel/layout.ts]] *(from #service)*
- [[src_utils_cartel_layoutBase|src/utils/cartel/layoutBase.ts]] *(from #service)*
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/composiciones.test.ts`
- `src/utils/cartel/__tests__/layout.test.ts`
- `src/utils/cartel/__tests__/placas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
