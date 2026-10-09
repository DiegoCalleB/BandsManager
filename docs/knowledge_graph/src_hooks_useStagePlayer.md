---
id: src_hooks_useStagePlayer
title: "src/hooks/useStagePlayer.ts"
layer: hook
domain: system
file: "src/hooks/useStagePlayer.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useStagePlayer.ts

> **Ubicación:** `src/hooks/useStagePlayer.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: useStagePlayer.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_crossfade|src/utils/crossfade.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
