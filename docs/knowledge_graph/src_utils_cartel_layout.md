---
id: src_utils_cartel_layout
title: "src/utils/cartel/layout.ts"
layer: service
domain: system
file: "src/utils/cartel/layout.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/layout.ts

> **Ubicación:** `src/utils/cartel/layout.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Dónde va cada cosa en el cartel. Puro: recibe un medidor de texto (en el navegador,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_composiciones|src/utils/cartel/composiciones.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_formatos|src/utils/cartel/formatos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_layoutBase|src/utils/cartel/layoutBase.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_utils_cartel_datos|src/utils/cartel/datos.ts]] *(from #service)*
- [[src_utils_cartel_placas|src/utils/cartel/placas.ts]] *(from #service)*
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(from #service)*
- [[src_utils_cartel_velo|src/utils/cartel/velo.ts]] *(from #service)*
- [[src_utils_cartel_ventana|src/utils/cartel/ventana.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/composiciones.test.ts`
- `src/utils/cartel/__tests__/layout.test.ts`
- `src/utils/cartel/__tests__/placas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
