---
id: src_utils_estiloArmonia
title: "src/utils/estiloArmonia.ts"
layer: service
domain: system
file: "src/utils/estiloArmonia.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/estiloArmonia.ts

> **Ubicación:** `src/utils/estiloArmonia.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: EstiloArmonia, ESTILO_POR_DEFECTO, leerEstiloArmonia, guardarEstiloArmonia, CLASE_FUNCION, LETRA_FUNCION, textoDeAcorde, gradoVisible.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(from #frontend)*
- [[src_components_chords_DrawerDiagramas|src/components/chords/DrawerDiagramas.tsx]] *(from #frontend)*
- [[src_components_chords_LineaTiempoAcordes|src/components/chords/LineaTiempoAcordes.tsx]] *(from #frontend)*
- [[src_components_chords_PanelArmonia|src/components/chords/PanelArmonia.tsx]] *(from #frontend)*
- [[src_components_chords_SelectorArmonia|src/components/chords/SelectorArmonia.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/panelArmonia.test.tsx`
- `src/utils/__tests__/estiloArmonia.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
