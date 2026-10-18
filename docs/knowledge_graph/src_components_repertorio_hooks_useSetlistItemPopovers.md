---
id: src_components_repertorio_hooks_useSetlistItemPopovers
title: "src/components/repertorio/hooks/useSetlistItemPopovers.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/hooks/useSetlistItemPopovers.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/hooks/useSetlistItemPopovers.ts

> **Ubicación:** `src/components/repertorio/hooks/useSetlistItemPopovers.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Arrastre de items, popovers de energía y tonalidad deseada por item, y edición de energía desde el gráfico.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
