---
id: src_components_atril_hooks_useAtrilState
title: "src/components/atril/hooks/useAtrilState.ts"
layer: frontend
domain: repertoire
file: "src/components/atril/hooks/useAtrilState.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/hooks/useAtrilState.ts

> **Ubicación:** `src/components/atril/hooks/useAtrilState.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Estado base del Atril: pestañas, notación, transposición, cifrado, paneles y pantalla completa.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_hooks_useAutoScroll|src/hooks/useAutoScroll.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useMetronomo|src/hooks/useMetronomo.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_modosAtril|src/utils/modosAtril.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_hooks_useAtrilController|src/components/atril/hooks/useAtrilController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
