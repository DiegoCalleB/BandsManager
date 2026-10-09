---
id: src_hooks_useGrabarIdea
title: "src/hooks/useGrabarIdea.ts"
layer: hook
domain: system
file: "src/hooks/useGrabarIdea.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useGrabarIdea.ts

> **Ubicación:** `src/hooks/useGrabarIdea.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: FaseGrabacion, TomaGrabada, useGrabarIdea.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_grabarIdea|src/utils/grabarIdea.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_GrabarIdea|src/components/chords/GrabarIdea.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
