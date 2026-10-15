---
id: src_utils_cartel_datos
title: "src/utils/cartel/datos.ts"
layer: service
domain: system
file: "src/utils/cartel/datos.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/datos.ts

> **Ubicación:** `src/utils/cartel/datos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Del bolo a los datos del cartel. Puro.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_layout|src/utils/cartel/layout.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_texto|src/utils/cartel/texto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_cartel_AjustesCartel|src/components/cartel/AjustesCartel.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_components_cartel_PreguntaCabeza|src/components/cartel/PreguntaCabeza.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/datos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
