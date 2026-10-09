---
id: server_services_socialRadarService
title: "server/services/socialRadarService.ts"
layer: service
domain: social
file: "server/services/socialRadarService.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/socialRadarService.ts

> **Ubicación:** `server/services/socialRadarService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Exporta: scrapeChannelMetrics, executeSocialRadar, startSocialRadarScheduler.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
