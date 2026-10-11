---
id: src_components_chords_progresoOido
title: "src/components/chords/progresoOido.ts"
layer: frontend
domain: repertoire
file: "src/components/chords/progresoOido.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/chords/progresoOido.ts

> **Ubicación:** `src/components/chords/progresoOido.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Progreso de una escucha de Chordscribe (acordes o letra): tipos, sondeo al servidor y el

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chords_ModalOido|src/components/chords/ModalOido.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
