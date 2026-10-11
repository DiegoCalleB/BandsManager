---
id: server_services_openDataCulturalService
title: "server/services/openDataCulturalService.ts"
layer: service
domain: system
file: "server/services/openDataCulturalService.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/openDataCulturalService.ts

> **Ubicación:** `server/services/openDataCulturalService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: OpenDataCulturalEvent, fetchMadridOpenDataCulturalEvents.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_publicCulturalEventsRadarService|server/services/publicCulturalEventsRadarService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
