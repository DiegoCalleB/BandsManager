---
id: src_components_atril_AtrilContext
title: "src/components/atril/AtrilContext.ts"
layer: frontend
domain: repertoire
file: "src/components/atril/AtrilContext.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/AtrilContext.ts

> **Ubicación:** `src/components/atril/AtrilContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Contexto del Atril: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_Atril|src/components/Atril.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_hooks_useAtrilController|src/components/atril/hooks/useAtrilController.ts]] *(Layer: #frontend, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AiSuccessBanner|src/components/atril/AiSuccessBanner.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilAudioElement|src/components/atril/AtrilAudioElement.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilBody|src/components/atril/AtrilBody.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilHeader|src/components/atril/AtrilHeader.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilModals|src/components/atril/AtrilModals.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilProvider|src/components/atril/AtrilProvider.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilToolbar|src/components/atril/AtrilToolbar.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilView|src/components/atril/AtrilView.tsx]] *(from #frontend)*
- [[src_components_atril_DetectedChordsPanel|src/components/atril/DetectedChordsPanel.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/atril/__tests__/atrilContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
