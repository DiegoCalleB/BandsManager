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
- [[ext_sentry|Sentry]] *(Layer: #external, Domain: #system)*
- [[server_utils_version|server/utils/version.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[server_routes_contactoEmpresas|server/routes/contactoEmpresas.ts]] *(from #route)*
- [[server_routes_emailsCicloVida|server/routes/emailsCicloVida.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_interesados|server/routes/interesados.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_pegatinas|server/routes/pegatinas.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*
- [[server_services_avisosPublicacion|server/services/avisosPublicacion.ts]] *(from #service)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*
- [[server_services_campaignRadarScheduler|server/services/campaignRadarScheduler.ts]] *(from #service)*
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*
- [[server_services_emailsCicloVida|server/services/emailsCicloVida.ts]] *(from #service)*
- [[server_services_metricasReels|server/services/metricasReels.ts]] *(from #service)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
