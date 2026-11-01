---
id: src_components_cartel_hooks_useOrdenCartel
title: "src/components/cartel/hooks/useOrdenCartel.ts"
layer: frontend
domain: system
file: "src/components/cartel/hooks/useOrdenCartel.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/cartel/hooks/useOrdenCartel.ts

> **Ubicación:** `src/components/cartel/hooks/useOrdenCartel.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: MAX_ORDEN_UI, ResultadoOrden, useOrdenCartel.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_formatos|src/utils/cartel/formatos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_ordenes|src/utils/cartel/ordenes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_textosLibres|src/utils/cartel/textosLibres.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_components_cartel_OrdenCartel|src/components/cartel/OrdenCartel.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
