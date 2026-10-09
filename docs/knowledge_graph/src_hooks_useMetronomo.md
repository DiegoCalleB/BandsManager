---
id: src_hooks_useMetronomo
title: "src/hooks/useMetronomo.ts"
layer: hook
domain: system
file: "src/hooks/useMetronomo.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useMetronomo.ts

> **Ubicación:** `src/hooks/useMetronomo.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: Metronomo, BPM_MIN, BPM_MAX, acotarBpm, bpmDeToques, useMetronomo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_clicMetronomo|src/utils/clicMetronomo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_ControlMetronomo|src/components/chords/ControlMetronomo.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/metronomoAtril.test.tsx`
- `src/audit/metronomoUnico.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
