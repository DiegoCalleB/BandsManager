---
id: src_components_atril_AtrilCompases
title: "src/components/atril/AtrilCompases.tsx"
layer: frontend
domain: repertoire
file: "src/components/atril/AtrilCompases.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/AtrilCompases.tsx

> **Ubicación:** `src/components/atril/AtrilCompases.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Pestaña de letra y acordes en modo «Compases»: la rejilla de compases del audio con la letra

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_atril_AtrilContext|src/components/atril/AtrilContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_hooks_useVistaAtril|src/components/atril/hooks/useVistaAtril.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_VistaCompases|src/components/chords/VistaCompases.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_cuadriculaCompases|src/utils/cuadriculaCompases.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_vistaCompases|src/utils/vistaCompases.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilBody|src/components/atril/AtrilBody.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
