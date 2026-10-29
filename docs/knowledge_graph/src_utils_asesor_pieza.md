---
id: src_utils_asesor_pieza
title: "src/utils/asesor/pieza.ts"
layer: service
domain: system
file: "src/utils/asesor/pieza.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/pieza.ts

> **Ubicación:** `src/utils/asesor/pieza.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
La pieza lista para publicar que prepara el asesor con IA: una sola forma para los cuatro

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[src_components_asesor_hooks_useAsesor|src/components/asesor/hooks/useAsesor.ts]] *(from #frontend)*
- [[src_components_asesor_hooks_useLaminas|src/components/asesor/hooks/useLaminas.ts]] *(from #frontend)*
- [[src_components_asesor_LaminasPieza|src/components/asesor/LaminasPieza.tsx]] *(from #frontend)*
- [[src_components_asesor_PiezaSheet|src/components/asesor/PiezaSheet.tsx]] *(from #frontend)*
- [[src_utils_asesor_laminas|src/utils/asesor/laminas.ts]] *(from #service)*
- [[src_utils_asesor_vozAprendida|src/utils/asesor/vozAprendida.ts]] *(from #service)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/laminas.test.ts`
- `src/utils/asesor/__tests__/pieza.test.ts`
- `src/utils/asesor/__tests__/vozAprendida.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
