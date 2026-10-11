---
id: src_utils_appDataNormalize
title: "src/utils/appDataNormalize.ts"
layer: service
domain: system
file: "src/utils/appDataNormalize.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/appDataNormalize.ts

> **Ubicación:** `src/utils/appDataNormalize.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: dedupeById, normalizeRehearsal, normalizeConcert.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[hook_app_data|useAppData Hook]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
