---
id: server_utils_errorTracking
title: "server/utils/errorTracking.ts"
layer: service
domain: system
file: "server/utils/errorTracking.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/errorTracking.ts

> **Ubicación:** `server/utils/errorTracking.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Red de errores del servidor: hasta ahora, un fallo no anticipado (uno que ningún try/catch

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_version|server/utils/version.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*
- [[server_services_campaignRadarScheduler|server/services/campaignRadarScheduler.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
