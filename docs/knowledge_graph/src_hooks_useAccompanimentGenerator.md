---
id: src_hooks_useAccompanimentGenerator
title: "src/hooks/useAccompanimentGenerator.ts"
layer: hook
domain: system
file: "src/hooks/useAccompanimentGenerator.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useAccompanimentGenerator.ts

> **Ubicación:** `src/hooks/useAccompanimentGenerator.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: useAccompanimentGenerator.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_accompanimentSynth|src/utils/accompanimentSynth.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
