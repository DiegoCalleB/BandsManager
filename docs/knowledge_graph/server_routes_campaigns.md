---
id: server_routes_campaigns
title: "server/routes/campaigns.ts"
layer: route
domain: system
file: "server/routes/campaigns.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/campaigns.ts

> **Ubicación:** `server/routes/campaigns.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Campañas de booking masivas: CRUD, campaña activa y registro de entrenamiento de tono. Scoping por

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_campaignRadarScheduler|server/services/campaignRadarScheduler.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
