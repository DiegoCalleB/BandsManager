---
id: server_routes_metrics
title: "server/routes/metrics.ts"
layer: route
domain: system
file: "server/routes/metrics.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/metrics.ts

> **Ubicación:** `server/routes/metrics.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Métricas de la banda y de redes: CRUD, sincronización y métricas reales

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_socialRadarService|server/services/socialRadarService.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_metricas_panel|Panel y métricas]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(from #frontend)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
