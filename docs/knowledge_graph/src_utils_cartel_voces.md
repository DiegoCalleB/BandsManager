---
id: src_utils_cartel_voces
title: "src/utils/cartel/voces.ts"
layer: service
domain: system
file: "src/utils/cartel/voces.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/voces.ts

> **Ubicación:** `src/utils/cartel/voces.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
La «letra» del cartel: la tipografía de exhibición del nombre y del día. Un cartel de verdad no usa la

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_estilos|src/utils/cartel/estilos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_asesor_hooks_useLaminas|src/components/asesor/hooks/useLaminas.ts]] *(from #frontend)*
- [[src_components_asesor_LaminasPieza|src/components/asesor/LaminasPieza.tsx]] *(from #frontend)*
- [[src_components_cartel_AjustesCartel|src/components/cartel/AjustesCartel.tsx]] *(from #frontend)*
- [[src_components_cartel_AjusteTexto|src/components/cartel/AjusteTexto.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_utils_asesor_adnVisual|src/utils/asesor/adnVisual.ts]] *(from #service)*
- [[src_utils_asesor_renderLaminas|src/utils/asesor/renderLaminas.ts]] *(from #service)*
- [[src_utils_cartel_ajustesFinos|src/utils/cartel/ajustesFinos.ts]] *(from #service)*
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(from #service)*
- [[src_utils_cartel_layoutBase|src/utils/cartel/layoutBase.ts]] *(from #service)*
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/ajustesFinos.test.ts`
- `src/utils/cartel/__tests__/composiciones.test.ts`
- `src/utils/cartel/__tests__/estilosBloques.test.ts`
- `src/utils/cartel/__tests__/voces.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
