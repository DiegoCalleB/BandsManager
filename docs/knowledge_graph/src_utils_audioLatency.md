---
id: src_utils_audioLatency
title: "src/utils/audioLatency.ts"
layer: service
domain: repertoire
file: "src/utils/audioLatency.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/audioLatency.ts

> **Ubicación:** `src/utils/audioLatency.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Utility for ultra-low latency & clean audio capture, WebAudio DSP filtering,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*
- [[src_hooks_useGrabarIdea|src/hooks/useGrabarIdea.ts]] *(from #hook)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
