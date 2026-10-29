---
id: src_utils_asesor_laminas
title: "src/utils/asesor/laminas.ts"
layer: service
domain: system
file: "src/utils/asesor/laminas.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/laminas.ts

> **Ubicación:** `src/utils/asesor/laminas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Láminas de una pieza: las imágenes listas para subir de unas stories o un carrusel. Lógica pura

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_pieza|src/utils/asesor/pieza.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_contraste|src/utils/cartel/contraste.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_paleta|src/utils/cartel/paleta.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_asesor_hooks_useLaminas|src/components/asesor/hooks/useLaminas.ts]] *(from #frontend)*
- [[src_components_asesor_LaminasPieza|src/components/asesor/LaminasPieza.tsx]] *(from #frontend)*
- [[src_components_asesor_PiezaSheet|src/components/asesor/PiezaSheet.tsx]] *(from #frontend)*
- [[src_utils_asesor_adnVisual|src/utils/asesor/adnVisual.ts]] *(from #service)*
- [[src_utils_asesor_renderLaminas|src/utils/asesor/renderLaminas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/laminas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
