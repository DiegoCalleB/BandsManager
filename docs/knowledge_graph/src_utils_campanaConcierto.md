---
id: src_utils_campanaConcierto
title: "src/utils/campanaConcierto.ts"
layer: service
domain: system
file: "src/utils/campanaConcierto.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/campanaConcierto.ts

> **Ubicación:** `src/utils/campanaConcierto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Campaña de cuenta atrás de un concierto: qué publicar y cuándo. Lógica pura, sin I/O, compartida

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_services_asesorInstagram|server/services/asesorInstagram.ts]] *(from #service)*
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[server_services_asesorRedes|server/services/asesorRedes.ts]] *(from #service)*
- [[src_components_asesor_AgendaAsesor|src/components/asesor/AgendaAsesor.tsx]] *(from #frontend)*
- [[src_components_asesor_OtrasRedesCard|src/components/asesor/OtrasRedesCard.tsx]] *(from #frontend)*
- [[src_components_asesor_PorMedirCard|src/components/asesor/PorMedirCard.tsx]] *(from #frontend)*
- [[src_components_calendar_PromocionConciertoModal|src/components/calendar/PromocionConciertoModal.tsx]] *(from #frontend)*
- [[src_utils_asesor_agenda|src/utils/asesor/agenda.ts]] *(from #service)*
- [[src_utils_asesor_diagnostico|src/utils/asesor/diagnostico.ts]] *(from #service)*
- [[src_utils_asesor_instagramMedios|src/utils/asesor/instagramMedios.ts]] *(from #service)*
- [[src_utils_asesor_metricasPorRed|src/utils/asesor/metricasPorRed.ts]] *(from #service)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(from #service)*
- [[src_utils_asesor_rescate|src/utils/asesor/rescate.ts]] *(from #service)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(from #service)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/campanaConcierto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
