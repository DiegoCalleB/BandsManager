---
id: src_components_asesor_hooks_useLaminas
title: "src/components/asesor/hooks/useLaminas.ts"
layer: frontend
domain: system
file: "src/components/asesor/hooks/useLaminas.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/asesor/hooks/useLaminas.ts

> **Ubicación:** `src/components/asesor/hooks/useLaminas.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: BandaLaminas, useLaminas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_adnVisual|src/utils/asesor/adnVisual.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_laminas|src/utils/asesor/laminas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_pieza|src/utils/asesor/pieza.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_renderLaminas|src/utils/asesor/renderLaminas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_adn|src/utils/cartel/adn.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_paleta|src/utils/cartel/paleta.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_voces|src/utils/cartel/voces.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_asesor_AsesorView|src/components/asesor/AsesorView.tsx]] *(from #frontend)*
- [[src_components_asesor_LaminasPieza|src/components/asesor/LaminasPieza.tsx]] *(from #frontend)*
- [[src_components_asesor_PiezaSheet|src/components/asesor/PiezaSheet.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
