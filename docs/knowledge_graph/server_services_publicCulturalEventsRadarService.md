---
id: server_services_publicCulturalEventsRadarService
title: "server/services/publicCulturalEventsRadarService.ts"
layer: service
domain: system
file: "server/services/publicCulturalEventsRadarService.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/publicCulturalEventsRadarService.ts

> **Ubicación:** `server/services/publicCulturalEventsRadarService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
PUBLIC CULTURAL & MUNICIPAL EVENTS RADAR SERVICE

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_openDataCulturalService|server/services/openDataCulturalService.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
