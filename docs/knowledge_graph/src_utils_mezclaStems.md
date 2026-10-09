---
id: src_utils_mezclaStems
title: "src/utils/mezclaStems.ts"
layer: service
domain: repertoire
file: "src/utils/mezclaStems.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/mezclaStems.ts

> **Ubicación:** `src/utils/mezclaStems.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: ModoEscucha, instrumentoDePista, pistaDelUsuario, pistasParaModo, AjustePista, AjustesPistas, pistaConAjuste, hayPistaEnSolo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_instrumentoProfesor|src/utils/instrumentoProfesor.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_MezclaPistas|src/components/chords/MezclaPistas.tsx]] *(from #frontend)*
- [[src_components_chords_SelectorEscucha|src/components/chords/SelectorEscucha.tsx]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_hooks_useMezclaStems|src/hooks/useMezclaStems.ts]] *(from #hook)*
- [[src_utils_mezclaGuardada|src/utils/mezclaGuardada.ts]] *(from #service)*
- [[src_utils_modosAtril|src/utils/modosAtril.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/mezclaAjustes.test.ts`
- `src/utils/__tests__/mezclaStems.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
