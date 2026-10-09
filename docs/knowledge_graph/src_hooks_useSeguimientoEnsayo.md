---
id: src_hooks_useSeguimientoEnsayo
title: "src/hooks/useSeguimientoEnsayo.ts"
layer: hook
domain: system
file: "src/hooks/useSeguimientoEnsayo.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useSeguimientoEnsayo.ts

> **Ubicación:** `src/hooks/useSeguimientoEnsayo.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: EvaluacionPista, useSeguimientoEnsayo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_agendaEnsayo|src/utils/agendaEnsayo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_ensayos|Ensayos]] *(from #feature)*
- [[src_components_ensayos_BarraSeguimientoEnsayo|src/components/ensayos/BarraSeguimientoEnsayo.tsx]] *(from #frontend)*
- [[src_components_ensayos_BotonesEvaluacion|src/components/ensayos/BotonesEvaluacion.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
