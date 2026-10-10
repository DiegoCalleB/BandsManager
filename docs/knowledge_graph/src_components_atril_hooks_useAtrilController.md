---
id: src_components_atril_hooks_useAtrilController
title: "src/components/atril/hooks/useAtrilController.ts"
layer: frontend
domain: repertoire
file: "src/components/atril/hooks/useAtrilController.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/hooks/useAtrilController.ts

> **Ubicación:** `src/components/atril/hooks/useAtrilController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Controlador del Atril: compone estado base, audio, análisis de acordes, edición y armonía.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_Atril|src/components/Atril.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_hooks_useAtrilAudio|src/components/atril/hooks/useAtrilAudio.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_hooks_useAtrilEditing|src/components/atril/hooks/useAtrilEditing.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_hooks_useAtrilHarmony|src/components/atril/hooks/useAtrilHarmony.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_hooks_useAtrilState|src/components/atril/hooks/useAtrilState.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_hooks_useChordAnalysis|src/components/atril/hooks/useChordAnalysis.ts]] *(Layer: #frontend, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilContext|src/components/atril/AtrilContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
