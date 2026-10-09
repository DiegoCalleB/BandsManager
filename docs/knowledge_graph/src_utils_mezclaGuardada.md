---
id: src_utils_mezclaGuardada
title: "src/utils/mezclaGuardada.ts"
layer: service
domain: system
file: "src/utils/mezclaGuardada.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/mezclaGuardada.ts

> **Ubicación:** `src/utils/mezclaGuardada.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: MezclaGuardada, VELOCIDADES_ATRIL, MEZCLA_VACIA, claveMezclaAtril, leerMezcla, serializarMezcla.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_mezclaStems|src/utils/mezclaStems.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chords_ControlVelocidad|src/components/chords/ControlVelocidad.tsx]] *(from #frontend)*
- [[src_hooks_useMezclaGuardada|src/hooks/useMezclaGuardada.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
