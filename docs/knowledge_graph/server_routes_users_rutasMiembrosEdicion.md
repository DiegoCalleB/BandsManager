---
id: server_routes_users_rutasMiembrosEdicion
title: "server/routes/users/rutasMiembrosEdicion.ts"
layer: route
domain: system
file: "server/routes/users/rutasMiembrosEdicion.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/rutasMiembrosEdicion.ts

> **Ubicación:** `server/routes/users/rutasMiembrosEdicion.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Editar una cuenta (la propia o, si eres líder, la de un miembro) y dar de baja a un miembro.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_users_bandasDisponibles|server/routes/users/bandasDisponibles.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users_permisosCuenta|server/routes/users/permisosCuenta.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[src_components_band_switcher_hooks_useBandActions|src/components/band_switcher/hooks/useBandActions.ts]] *(from #frontend)*
- [[src_components_user_profile_hooks_useProfileIdentity|src/components/user_profile/hooks/useProfileIdentity.ts]] *(from #frontend)*
- [[src_components_user_profile_hooks_useUserProfileController|src/components/user_profile/hooks/useUserProfileController.ts]] *(from #frontend)*
- [[src_components_UserManagementModal|src/components/UserManagementModal.tsx]] *(from #frontend)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
