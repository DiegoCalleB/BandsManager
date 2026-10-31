---
id: src_utils_asesor_agenda
title: "src/utils/asesor/agenda.ts"
layer: service
domain: system
file: "src/utils/asesor/agenda.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/agenda.ts

> **Ubicación:** `src/utils/asesor/agenda.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El calendario del asesor: una agenda de tres semanas (la pasada y las dos próximas) con lo que

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_diagnostico|src/utils/asesor/diagnostico.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_diagnosticoMetricas|src/utils/asesor/diagnosticoMetricas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_metricasPorRed|src/utils/asesor/metricasPorRed.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_tipos|src/utils/asesor/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[src_components_asesor_AgendaAsesor|src/components/asesor/AgendaAsesor.tsx]] *(from #frontend)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/agenda.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
