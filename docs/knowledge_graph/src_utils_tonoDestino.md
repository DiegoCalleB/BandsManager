---
id: src_utils_tonoDestino
title: "src/utils/tonoDestino.ts"
layer: service
domain: system
file: "src/utils/tonoDestino.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/tonoDestino.ts

> **Ubicación:** `src/utils/tonoDestino.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Semitonos (−6…+6) para llevar una tónica a otra por el camino más corto: E→G = +3, E→C = −4.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chords_ControlTonoDestino|src/components/chords/ControlTonoDestino.tsx]] *(from #frontend)*
- [[src_components_chords_ControlVelocidad|src/components/chords/ControlVelocidad.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/tonoDestino.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
