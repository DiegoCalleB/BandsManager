---
id: server_routes_users_adminInicial
title: "server/routes/users/adminInicial.ts"
layer: route
domain: system
file: "server/routes/users/adminInicial.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/adminInicial.ts

> **Ubicación:** `server/routes/users/adminInicial.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Alta o actualización del administrador global al arrancar (contraseña solo desde ADMIN_PASSWORD).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
