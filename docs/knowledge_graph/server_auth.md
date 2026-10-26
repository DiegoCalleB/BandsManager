---
id: server_auth
title: "server/auth.ts"
layer: security
domain: auth
file: "server/auth.ts"
tags: ["security", "auth", "auto"]
---

# 📌 server/auth.ts

> **Ubicación:** `server/auth.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/auth`

## 📖 Descripción
Exporta: EstadoDeSesion, ACTIVE_SESSIONS, hashPassword, verifyPassword, getSafeUsers, UsuarioDeSesion, getUserFromRequest, createAuthMiddleware.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_routes_users_adminInicial|server/routes/users/adminInicial.ts]] *(from #route)*
- [[server_routes_users_rutasGoogle|server/routes/users/rutasGoogle.ts]] *(from #route)*
- [[server_routes_users_rutasInvitacion|server/routes/users/rutasInvitacion.ts]] *(from #route)*
- [[server_routes_users_rutasLogin|server/routes/users/rutasLogin.ts]] *(from #route)*
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(from #route)*
- [[server_routes_users_rutasMiembrosEdicion|server/routes/users/rutasMiembrosEdicion.ts]] *(from #route)*
- [[server_routes_users_rutasRecuperacion|server/routes/users/rutasRecuperacion.ts]] *(from #route)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(from #route)*
- [[server_routes_users_rutasSalidaBanda|server/routes/users/rutasSalidaBanda.ts]] *(from #route)*
- [[server_routes_users_rutasSesion|server/routes/users/rutasSesion.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/__tests__/auth_bandas.test.ts`
- `server/routes/__tests__/adminPassword.test.ts`
- `server/routes/__tests__/loginBdCaida.test.ts`
- `server/routes/__tests__/seguridadAutorizacion.test.ts`
- `server/routes/__tests__/superficieUsersAiMusic.test.ts`
- `server/routes/__tests__/usersCuentasSeguridad.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
