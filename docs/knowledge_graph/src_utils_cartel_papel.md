---
id: src_utils_cartel_papel
title: "src/utils/cartel/papel.ts"
layer: service
domain: system
file: "src/utils/cartel/papel.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/papel.ts

> **Ubicación:** `src/utils/cartel/papel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El «papel» de una ilustración de IA y su tinta. Puro (se prueba sin DOM); `leerArte` lo alimenta desde un canvas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_contraste|src/utils/cartel/contraste.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_paleta|src/utils/cartel/paleta.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_utils_cartel_placas|src/utils/cartel/placas.ts]] *(from #service)*
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/papel.test.ts`
- `src/utils/cartel/__tests__/placas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
