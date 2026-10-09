---
id: src_utils_epkUtils
title: "src/utils/epkUtils.ts"
layer: service
domain: epk
file: "src/utils/epkUtils.ts"
tags: ["service", "epk", "auto"]
---

# 📌 src/utils/epkUtils.ts

> **Ubicación:** `src/utils/epkUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/epk`

## 📖 Descripción
Exporta: EPKCompletenessResult, isBioComplete, isDossierComplete, isRiderComplete, calculateEPKCompletenessScore, generateEPKPressKitSummary.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/epkUtils.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
