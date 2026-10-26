---
id: src_components_atril_AjusteCompases
title: "src/components/atril/AjusteCompases.tsx"
layer: frontend
domain: repertoire
file: "src/components/atril/AjusteCompases.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/AjusteCompases.tsx

> **Ubicación:** `src/components/atril/AjusteCompases.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Correcciones rápidas de los compases: tap tempo, «compás 1 aquí», desplazar un pulso, ½×/2×,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_ajusteCompases|src/utils/ajusteCompases.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cuadriculaCompases|src/utils/cuadriculaCompases.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilCompases|src/components/atril/AtrilCompases.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/vistaCompases.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
