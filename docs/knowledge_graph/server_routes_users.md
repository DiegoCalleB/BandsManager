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
Cuentas, sesión y bandas de un usuario: alta, login (contraseña o Google), recuperación de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_users_adminInicial|server/routes/users/adminInicial.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_bandasDisponibles|server/routes/users/bandasDisponibles.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasBandas|server/routes/users/rutasBandas.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasGoogle|server/routes/users/rutasGoogle.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasInvitacion|server/routes/users/rutasInvitacion.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasLogin|server/routes/users/rutasLogin.ts]] *(Layer: #route, Domain: #auth)*
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasMiembrosEdicion|server/routes/users/rutasMiembrosEdicion.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasPreferencias|server/routes/users/rutasPreferencias.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasRecuperacion|server/routes/users/rutasRecuperacion.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasSalidaBanda|server/routes/users/rutasSalidaBanda.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_rutasSesion|server/routes/users/rutasSesion.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server|server.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/adminPassword.test.ts`
- `server/routes/__tests__/authGoogleSeguridad.test.ts`
- `server/routes/__tests__/buildAvailableBandsForUser.test.ts`
- `server/routes/__tests__/invitacionMiembros.test.ts`
- `server/routes/__tests__/seguridadAutorizacion.test.ts`
- `server/routes/__tests__/superficieUsersAiMusic.test.ts`
- `server/routes/__tests__/usersCuentasSeguridad.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
