---
id: src_utils_instrumentoProfesor
title: "src/utils/instrumentoProfesor.ts"
layer: service
domain: system
file: "src/utils/instrumentoProfesor.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/instrumentoProfesor.ts

> **Ubicación:** `src/utils/instrumentoProfesor.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: InstrumentoProfesor, instrumentoDesdeTexto, instrumentoDelUsuario.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_services_sesionLocal|src/services/sesionLocal.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilBody|src/components/atril/AtrilBody.tsx]] *(from #frontend)*
- [[src_components_atril_hooks_useAtrilAudio|src/components/atril/hooks/useAtrilAudio.ts]] *(from #frontend)*
- [[src_components_chords_PanelArmonia|src/components/chords/PanelArmonia.tsx]] *(from #frontend)*
- [[src_components_chords_ProfesorIA|src/components/chords/ProfesorIA.tsx]] *(from #frontend)*
- [[src_components_chords_SelectorInstrumentoProfesor|src/components/chords/SelectorInstrumentoProfesor.tsx]] *(from #frontend)*
- [[src_components_chords_useVistaAcordes|src/components/chords/useVistaAcordes.ts]] *(from #frontend)*
- [[src_utils_mezclaStems|src/utils/mezclaStems.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/instrumentoProfesor.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
