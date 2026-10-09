---
id: src_utils_setlistOptimization
title: "src/utils/setlistOptimization.ts"
layer: service
domain: repertoire
file: "src/utils/setlistOptimization.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/setlistOptimization.ts

> **Ubicación:** `src/utils/setlistOptimization.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: calculateSetlistDurationSec, SetlistMatchResult, findBestSetlistMatch, generateAutoSetlistForConcert.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_BoloConfirmadoSetlistModal|src/components/booking/BoloConfirmadoSetlistModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
