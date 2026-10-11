---
id: server_routes_users_rutasRecuperacion
title: "server/routes/users/rutasRecuperacion.ts"
layer: route
domain: system
file: "server/routes/users/rutasRecuperacion.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/rutasRecuperacion.ts

> **Ubicación:** `server/routes/users/rutasRecuperacion.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Recuperación de contraseña (solicitud y confirmación) y correo de prueba.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*
- [[src_db_seed|src/db_seed.ts]] *(Layer: #service, Domain: #system)*

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
