---
id: src_hooks_useRepertorioItemPopovers
title: "src/hooks/useRepertorioItemPopovers.ts"
layer: hook
domain: system
file: "src/hooks/useRepertorioItemPopovers.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useRepertorioItemPopovers.ts

> **Ubicación:** `src/hooks/useRepertorioItemPopovers.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: UseRepertorioItemPopoversProps, useRepertorioItemPopovers.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/hooks/__tests__/useRepertorioItemPopovers.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
