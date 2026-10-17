---
id: server_utils_resumenSemanalReels
title: "server/utils/resumenSemanalReels.ts"
layer: service
domain: social
file: "server/utils/resumenSemanalReels.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/utils/resumenSemanalReels.ts

> **Ubicación:** `server/utils/resumenSemanalReels.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Resumen de la semana de los Reels de una banda: cuáles funcionaron mejor y qué probar después.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_aprendizajeReels|server/utils/aprendizajeReels.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_metricasReels|server/services/metricasReels.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/resumenSemanalReels.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
