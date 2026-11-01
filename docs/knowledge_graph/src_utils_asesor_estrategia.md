---
id: src_utils_asesor_estrategia
title: "src/utils/asesor/estrategia.ts"
layer: service
domain: system
file: "src/utils/asesor/estrategia.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/estrategia.ts

> **Ubicación:** `src/utils/asesor/estrategia.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
La «estrategia de marketing» de la banda: la capa del ADN que dice qué quiere conseguir y qué

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(from #db)*
- [[server_routes_asesor|server/routes/asesor.ts]] *(from #route)*
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[server_services_asesorRedes|server/services/asesorRedes.ts]] *(from #service)*
- [[src_components_asesor_FormEstrategia|src/components/asesor/FormEstrategia.tsx]] *(from #frontend)*
- [[src_components_asesor_hooks_useAsesor|src/components/asesor/hooks/useAsesor.ts]] *(from #frontend)*
- [[src_utils_asesor_agenda|src/utils/asesor/agenda.ts]] *(from #service)*
- [[src_utils_asesor_diagnostico|src/utils/asesor/diagnostico.ts]] *(from #service)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(from #service)*
- [[src_utils_asesor_pieza|src/utils/asesor/pieza.ts]] *(from #service)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/estrategia.test.ts`
- `src/utils/asesor/__tests__/opciones.test.ts`
- `src/utils/asesor/__tests__/pieza.test.ts`
- `src/utils/asesor/__tests__/rescate.test.ts`
- `src/utils/asesor/__tests__/resumen.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
