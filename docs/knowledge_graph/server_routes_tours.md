---
id: server_routes_tours
title: "server/routes/tours.ts"
layer: route
domain: system
file: "server/routes/tours.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/tours.ts

> **Ubicación:** `server/routes/tours.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Rutas de giras; la lógica vive en `server/controllers/` (capa fina routes → controller).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_controllers_tours_controller|server/controllers/tours.controller.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
