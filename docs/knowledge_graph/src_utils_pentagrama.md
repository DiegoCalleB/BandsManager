---
id: src_utils_pentagrama
title: "src/utils/pentagrama.ts"
layer: service
domain: system
file: "src/utils/pentagrama.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/pentagrama.ts

> **Ubicación:** `src/utils/pentagrama.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
De alturas MIDI a las claves que entiende VexFlow («c#/4»). Lógica pura: el dibujo vive en Pentagrama.tsx.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chords_DiagramaEscala|src/components/chords/DiagramaEscala.tsx]] *(from #frontend)*
- [[src_components_chords_Pentagrama|src/components/chords/Pentagrama.tsx]] *(from #frontend)*
- [[src_components_chords_PentagramaFicha|src/components/chords/PentagramaFicha.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/pentagrama.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
