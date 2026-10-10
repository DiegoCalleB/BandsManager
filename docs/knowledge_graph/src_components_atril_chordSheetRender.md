---
id: src_components_atril_chordSheetRender
title: "src/components/atril/chordSheetRender.tsx"
layer: frontend
domain: repertoire
file: "src/components/atril/chordSheetRender.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/chordSheetRender.tsx

> **Ubicación:** `src/components/atril/chordSheetRender.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Render del cifrado con acordes resaltados, alineación con la letra y armonía.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_chords_RelojEnAcorde|src/components/chords/RelojEnAcorde.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_utils_alineacionAcordes|src/utils/alineacionAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_armoniaVisor|src/utils/armoniaVisor.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_estiloArmonia|src/utils/estiloArmonia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilBody|src/components/atril/AtrilBody.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/atril/__tests__/atrilContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
