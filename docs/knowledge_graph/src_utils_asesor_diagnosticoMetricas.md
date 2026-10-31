---
id: src_utils_asesor_diagnosticoMetricas
title: "src/utils/asesor/diagnosticoMetricas.ts"
layer: service
domain: system
file: "src/utils/asesor/diagnosticoMetricas.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/diagnosticoMetricas.ts

> **Ubicación:** `src/utils/asesor/diagnosticoMetricas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Diagnóstico de una pieza publicada a partir de sus métricas, con los umbrales de la lección de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_utils_asesor_agenda|src/utils/asesor/agenda.ts]] *(from #service)*
- [[src_utils_asesor_chat|src/utils/asesor/chat.ts]] *(from #service)*
- [[src_utils_asesor_metricasPorRed|src/utils/asesor/metricasPorRed.ts]] *(from #service)*
- [[src_utils_asesor_rescate|src/utils/asesor/rescate.ts]] *(from #service)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/diagnosticoMetricas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
