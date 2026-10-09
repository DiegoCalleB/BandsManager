---
id: server_routes_users
title: "server/routes/users.ts"
layer: route
domain: system
file: "server/routes/users.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users.ts

> **Ubicación:** `server/routes/users.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Usuarios y autenticación: registro, login Google verificado, invitaciones de miembros,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_cuentaBrais|server/utils/cuentaBrais.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_googleVerify|server/utils/googleVerify.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_invitacion|server/utils/invitacion.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_slug|server/utils/slug.ts]] *(Layer: #service, Domain: #system)*
- [[src_db_seed|src/db_seed.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_BandSwitcherModal|src/components/BandSwitcherModal.tsx]] *(from #frontend)*
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(from #frontend)*
- [[src_components_SimplePromoLoginModal|src/components/SimplePromoLoginModal.tsx]] *(from #frontend)*
- [[src_components_UserManagementModal|src/components/UserManagementModal.tsx]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(from #security)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/adminPassword.test.ts`
- `server/routes/__tests__/authGoogleSeguridad.test.ts`
- `server/routes/__tests__/buildAvailableBandsForUser.test.ts`
- `server/routes/__tests__/invitacionMiembros.test.ts`
- `server/routes/__tests__/seguridadAutorizacion.test.ts`
- `server/routes/__tests__/usersCuentasSeguridad.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
