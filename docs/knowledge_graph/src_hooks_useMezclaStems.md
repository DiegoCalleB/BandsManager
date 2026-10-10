---
id: src_hooks_useMezclaStems
title: "src/hooks/useMezclaStems.ts"
layer: hook
domain: repertoire
file: "src/hooks/useMezclaStems.ts"
tags: ["hook", "repertoire", "auto"]
---

# 📌 src/hooks/useMezclaStems.ts

> **Ubicación:** `src/hooks/useMezclaStems.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: useMezclaStems.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_hooks_useTonePitchShift|src/hooks/useTonePitchShift.ts]] *(Layer: #hook, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_mezclaStems|src/utils/mezclaStems.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_hooks_useAtrilAudio|src/components/atril/hooks/useAtrilAudio.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
