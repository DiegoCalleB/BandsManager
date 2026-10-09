---
id: src_hooks_useAcordesDeLaHoja
title: "src/hooks/useAcordesDeLaHoja.ts"
layer: hook
domain: system
file: "src/hooks/useAcordesDeLaHoja.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useAcordesDeLaHoja.ts

> **Ubicación:** `src/hooks/useAcordesDeLaHoja.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: useAcordesDeLaHoja.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
