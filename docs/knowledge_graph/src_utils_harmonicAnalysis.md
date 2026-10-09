---
id: src_utils_harmonicAnalysis
title: "src/utils/harmonicAnalysis.ts"
layer: service
domain: system
file: "src/utils/harmonicAnalysis.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/harmonicAnalysis.ts

> **Ubicación:** `src/utils/harmonicAnalysis.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: TONALIDAD_FALLBACK, ParsedKey, parseTonalidad, tonalidadesSonFiables, CompatibilidadArmonica, evaluarTransicionArmonica, formatTonalidad.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_perfectSetlistPlanner|server/utils/perfectSetlistPlanner.ts]] *(from #service)*
- [[server_utils_setlistAIAnalyzer|server/utils/setlistAIAnalyzer.ts]] *(from #service)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(from #service)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(from #service)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(from #service)*
- [[src_utils_transitionSynthesizer|src/utils/transitionSynthesizer.ts]] *(from #service)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
