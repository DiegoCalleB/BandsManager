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
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(from #frontend)*
- [[src_components_chords_ProfesorIA|src/components/chords/ProfesorIA.tsx]] *(from #frontend)*
- [[src_utils_mezclaStems|src/utils/mezclaStems.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/instrumentoProfesor.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
