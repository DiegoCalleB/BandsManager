---
id: server_routes_concerts
title: "server/routes/concerts.ts"
layer: route
domain: system
file: "server/routes/concerts.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/concerts.ts

> **Ubicación:** `server/routes/concerts.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Conciertos y ensayos: CRUD de `/concerts` y `/rehearsals`. Capa de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/firmaDeFeed.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
