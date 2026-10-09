---
id: src_utils_teoriaArmonica
title: "src/utils/teoriaArmonica.ts"
layer: service
domain: system
file: "src/utils/teoriaArmonica.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/teoriaArmonica.ts

> **Ubicación:** `src/utils/teoriaArmonica.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Teoría armónica determinista para el «profesor de armonía»: grado romano de cada acorde, su

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_profesorArmonia|server/services/profesorArmonia.ts]] *(from #service)*
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_LineaTiempoAcordes|src/components/chords/LineaTiempoAcordes.tsx]] *(from #frontend)*
- [[src_components_chords_PanelArmonia|src/components/chords/PanelArmonia.tsx]] *(from #frontend)*
- [[src_components_chords_SelectorArmonia|src/components/chords/SelectorArmonia.tsx]] *(from #frontend)*
- [[src_hooks_useAcordesDeLaHoja|src/hooks/useAcordesDeLaHoja.ts]] *(from #hook)*
- [[src_utils_armoniaVisor|src/utils/armoniaVisor.ts]] *(from #service)*
- [[src_utils_estiloArmonia|src/utils/estiloArmonia.ts]] *(from #service)*
- [[src_utils_guiasArmonia|src/utils/guiasArmonia.ts]] *(from #service)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
