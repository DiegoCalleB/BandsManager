---
id: src_utils_vistaAcordes
title: "src/utils/vistaAcordes.ts"
layer: service
domain: system
file: "src/utils/vistaAcordes.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/vistaAcordes.ts

> **Ubicación:** `src/utils/vistaAcordes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: VistaAcorde, NotasParaDibujar, notasParaDibujar, CUERDAS_BAJO, RolBajo, NotaBajo, COLOR_FUNCION, lineaDeBajo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_alineacionAcordes|src/utils/alineacionAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_armoniaVisor|src/utils/armoniaVisor.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_lineaTiempoAcordes|src/utils/lineaTiempoAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(from #frontend)*
- [[src_components_chords_DrawerDiagramas|src/components/chords/DrawerDiagramas.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*
- [[src_hooks_useAcordesDeLaHoja|src/hooks/useAcordesDeLaHoja.ts]] *(from #hook)*

---

## 🧪 Tests que lo cubren
- `src/audit/drawerDiagramas.test.tsx`
- `src/utils/__tests__/vistaAcordes.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
