---
id: src_utils_vistaCompases
title: "src/utils/vistaCompases.ts"
layer: service
domain: system
file: "src/utils/vistaCompases.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/vistaCompases.ts

> **Ubicación:** `src/utils/vistaCompases.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: CasillaTiempo, CompasVista, FilaCompases, ANCHO_MIN_TIEMPO, compasesPorFila, casillasDeCompas, letraPorCompas, filasDeCompases.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cuadriculaCompases|src/utils/cuadriculaCompases.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilCompases|src/components/atril/AtrilCompases.tsx]] *(from #frontend)*
- [[src_components_chords_VistaCompases|src/components/chords/VistaCompases.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/vistaCompases.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
