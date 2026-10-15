---
id: src_components_chords_AcordeActual
title: "src/components/chords/AcordeActual.tsx"
layer: frontend
domain: repertoire
file: "src/components/chords/AcordeActual.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/chords/AcordeActual.tsx

> **Ubicación:** `src/components/chords/AcordeActual.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: BarraAcordeActual, DiagramasAcordeActual.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_RelojEnAcorde|src/components/chords/RelojEnAcorde.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_acordeActualEstado|src/components/chords/acordeActualEstado.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_utils_estiloArmonia|src/utils/estiloArmonia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_relojAcorde|src/utils/relojAcorde.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_voicings|src/utils/voicings.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilView|src/components/atril/AtrilView.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/acordeActual.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
