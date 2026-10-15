---
id: server_routes_users_rutasInvitacion
title: "server/routes/users/rutasInvitacion.ts"
layer: route
domain: system
file: "server/routes/users/rutasInvitacion.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/rutasInvitacion.ts

> **Ubicación:** `server/routes/users/rutasInvitacion.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Invitaciones de miembros: comprobar un enlace de invitación y activar la cuenta invitada.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_utils_invitacion|server/utils/invitacion.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
