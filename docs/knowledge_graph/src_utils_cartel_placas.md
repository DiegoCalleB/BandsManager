---
id: src_utils_cartel_placas
title: "src/utils/cartel/placas.ts"
layer: service
domain: system
file: "src/utils/cartel/placas.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/placas.ts

> **Ubicación:** `src/utils/cartel/placas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Placas de papel: en un cartel impreso el texto no flota encima de la ilustración, tiene su sitio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_layout|src/utils/cartel/layout.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_papel|src/utils/cartel/papel.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/placas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
