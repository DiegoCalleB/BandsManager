---
id: src_components_atril_hooks_useAtrilAudio
title: "src/components/atril/hooks/useAtrilAudio.ts"
layer: frontend
domain: repertoire
file: "src/components/atril/hooks/useAtrilAudio.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/hooks/useAtrilAudio.ts

> **Ubicación:** `src/components/atril/hooks/useAtrilAudio.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: AtrilAudioParams, useAtrilAudio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_hooks_useBucleAB|src/hooks/useBucleAB.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useGrabarIdea|src/hooks/useGrabarIdea.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useMezclaGuardada|src/hooks/useMezclaGuardada.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useMezclaStems|src/hooks/useMezclaStems.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_hooks_useTonoAudio|src/hooks/useTonoAudio.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_grabarIdea|src/utils/grabarIdea.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_instrumentoProfesor|src/utils/instrumentoProfesor.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_mezclaStems|src/utils/mezclaStems.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_modosAtril|src/utils/modosAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_separacionIris|src/utils/separacionIris.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_hooks_useAtrilController|src/components/atril/hooks/useAtrilController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
