---
id: server_routes_users_rutasLogin
title: "server/routes/users/rutasLogin.ts"
layer: route
domain: auth
file: "server/routes/users/rutasLogin.ts"
tags: ["route", "auth", "auto"]
---

# 📌 server/routes/users/rutasLogin.ts

> **Ubicación:** `server/routes/users/rutasLogin.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/auth`

## 📖 Descripción
Inicio de sesión con usuario o email y contraseña.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_users_bandasDisponibles|server/routes/users/bandasDisponibles.ts]] *(Layer: #route, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(from #frontend)*
- [[src_components_SimplePromoLoginModal|src/components/SimplePromoLoginModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
