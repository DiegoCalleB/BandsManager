---
id: server_services_campaignRadarScheduler
title: "server/services/campaignRadarScheduler.ts"
layer: service
domain: system
file: "server/services/campaignRadarScheduler.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/campaignRadarScheduler.ts

> **Ubicación:** `server/services/campaignRadarScheduler.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
CAMPAIGN RADAR SCHEDULER

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_venueEventsRadarService|server/services/venueEventsRadarService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(from #route)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
