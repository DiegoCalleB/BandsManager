---
id: src_utils_asesor_resumen
title: "src/utils/asesor/resumen.ts"
layer: service
domain: system
file: "src/utils/asesor/resumen.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/resumen.ts

> **Ubicación:** `src/utils/asesor/resumen.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El bucle de aprendizaje del asesor: qué piezas esperan sus números, qué cuenta como un número

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_diagnosticoMetricas|src/utils/asesor/diagnosticoMetricas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(from #db)*
- [[server_services_asesorInstagram|server/services/asesorInstagram.ts]] *(from #service)*
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[server_services_asesorRedes|server/services/asesorRedes.ts]] *(from #service)*
- [[src_components_asesor_hooks_useAsesor|src/components/asesor/hooks/useAsesor.ts]] *(from #frontend)*
- [[src_components_asesor_OtrasRedesCard|src/components/asesor/OtrasRedesCard.tsx]] *(from #frontend)*
- [[src_components_asesor_PorMedirCard|src/components/asesor/PorMedirCard.tsx]] *(from #frontend)*
- [[src_components_asesor_ResumenCard|src/components/asesor/ResumenCard.tsx]] *(from #frontend)*
- [[src_utils_asesor_agenda|src/utils/asesor/agenda.ts]] *(from #service)*
- [[src_utils_asesor_metricasPorRed|src/utils/asesor/metricasPorRed.ts]] *(from #service)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(from #service)*
- [[src_utils_asesor_rescate|src/utils/asesor/rescate.ts]] *(from #service)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/agenda.test.ts`
- `src/utils/asesor/__tests__/rescate.test.ts`
- `src/utils/asesor/__tests__/resumen.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
