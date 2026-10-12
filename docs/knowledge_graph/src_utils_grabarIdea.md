---
id: src_utils_grabarIdea
title: "src/utils/grabarIdea.ts"
layer: service
domain: system
file: "src/utils/grabarIdea.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/grabarIdea.ts

> **Ubicación:** `src/utils/grabarIdea.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: OFFSET_MAX_SEGUNDOS, PASO_OFFSET_SEGUNDOS, carpetaDeIdea, offsetInicial, limitarOffset, tituloDeToma, ficheroDeToma.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_hooks_useAtrilAudio|src/components/atril/hooks/useAtrilAudio.ts]] *(from #frontend)*
- [[src_components_chords_GrabarIdea|src/components/chords/GrabarIdea.tsx]] *(from #frontend)*
- [[src_hooks_useGrabarIdea|src/hooks/useGrabarIdea.ts]] *(from #hook)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/grabarIdea.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
