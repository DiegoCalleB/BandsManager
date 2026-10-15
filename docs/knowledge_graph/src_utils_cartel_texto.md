---
id: src_utils_cartel_texto
title: "src/utils/cartel/texto.ts"
layer: service
domain: system
file: "src/utils/cartel/texto.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/texto.ts

> **Ubicación:** `src/utils/cartel/texto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Textos del cartel: fecha legible y reparto en líneas. Puro, sin DOM.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_cartel_CarteleriaView|src/components/cartel/CarteleriaView.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_utils_cartel_datos|src/utils/cartel/datos.ts]] *(from #service)*
- [[src_utils_cartel_layout|src/utils/cartel/layout.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/texto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
