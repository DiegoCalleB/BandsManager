---
id: server_services_metricasReels
title: "server/services/metricasReels.ts"
layer: service
domain: social
file: "server/services/metricasReels.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/metricasReels.ts

> **Ubicación:** `server/services/metricasReels.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Recogida de métricas reales de los Reels publicados y aprendizaje por banda (Fase 5).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_reelClips|server/db/reelClips.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_reelMetricas|server/db/reelMetricas.ts]] *(Layer: #db, Domain: #social)*
- [[server_services_credencialesInstagram|server/services/credencialesInstagram.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_publicadores_instagramInsights|server/services/publicadores/instagramInsights.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_aprendizajeReels|server/utils/aprendizajeReels.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_reelsAprendizaje|server/routes/reelsAprendizaje.ts]] *(from #route)*
- [[server_services_workersReels|server/services/workersReels.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/metricasReels.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
