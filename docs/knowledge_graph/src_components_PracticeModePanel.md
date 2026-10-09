---
id: src_components_PracticeModePanel
title: "src/components/PracticeModePanel.tsx"
layer: frontend
domain: system
file: "src/components/PracticeModePanel.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/PracticeModePanel.tsx

> **Ubicación:** `src/components/PracticeModePanel.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: PracticeModePanel.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_config_stemInstruments|src/config/stemInstruments.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_hooks_useTonePitchShift|src/hooks/useTonePitchShift.ts]] *(Layer: #hook, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_bucleAB|src/utils/bucleAB.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_clicMetronomo|src/utils/clicMetronomo.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_mezclaStems|src/utils/mezclaStems.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(from #frontend)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
