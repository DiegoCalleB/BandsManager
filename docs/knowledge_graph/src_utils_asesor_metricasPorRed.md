---
id: src_utils_asesor_metricasPorRed
title: "src/utils/asesor/metricasPorRed.ts"
layer: service
domain: system
file: "src/utils/asesor/metricasPorRed.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/metricasPorRed.ts

> **Ubicación:** `src/utils/asesor/metricasPorRed.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Resultados de una pieza en TikTok y YouTube Shorts. Instagram tiene sus propios números y sus

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_diagnosticoMetricas|src/utils/asesor/diagnosticoMetricas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_tipos|src/utils/asesor/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(from #db)*
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[server_services_asesorRedes|server/services/asesorRedes.ts]] *(from #service)*
- [[src_components_asesor_FormMetricasRed|src/components/asesor/FormMetricasRed.tsx]] *(from #frontend)*
- [[src_components_asesor_hooks_useAsesor|src/components/asesor/hooks/useAsesor.ts]] *(from #frontend)*
- [[src_components_asesor_OtrasRedesCard|src/components/asesor/OtrasRedesCard.tsx]] *(from #frontend)*
- [[src_components_asesor_PorMedirCard|src/components/asesor/PorMedirCard.tsx]] *(from #frontend)*
- [[src_utils_asesor_agenda|src/utils/asesor/agenda.ts]] *(from #service)*
- [[src_utils_asesor_anuncios|src/utils/asesor/anuncios.ts]] *(from #service)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/anuncios.test.ts`
- `src/utils/asesor/__tests__/metricasPorRed.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
