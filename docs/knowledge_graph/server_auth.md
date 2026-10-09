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
Exporta: ACTIVE_SESSIONS, hashPassword, verifyPassword, getSafeUsers, getUserFromRequest, createAuthMiddleware, createLeaderMiddleware, createCronOrAuthMiddleware.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_cuentaBrais|server/utils/cuentaBrais.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/__tests__/auth_bandas.test.ts`
- `server/routes/__tests__/adminPassword.test.ts`
- `server/routes/__tests__/seguridadAutorizacion.test.ts`
- `server/routes/__tests__/usersCuentasSeguridad.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
