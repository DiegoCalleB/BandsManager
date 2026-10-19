---
id: server_routes_users_rutasGoogle
title: "server/routes/users/rutasGoogle.ts"
layer: route
domain: system
file: "server/routes/users/rutasGoogle.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/rutasGoogle.ts

> **Ubicación:** `server/routes/users/rutasGoogle.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Acceso con Google: el token se verifica criptográficamente contra el Client ID (AGENTS.md §1).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_users_bandasDisponibles|server/routes/users/bandasDisponibles.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_avisoAltas|server/services/avisoAltas.ts]] *(Layer: #service, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_googleVerify|server/utils/googleVerify.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_slug|server/utils/slug.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

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
