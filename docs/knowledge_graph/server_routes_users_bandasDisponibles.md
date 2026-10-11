---
id: server_routes_users_bandasDisponibles
title: "server/routes/users/bandasDisponibles.ts"
layer: route
domain: system
file: "server/routes/users/bandasDisponibles.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/bandasDisponibles.ts

> **Ubicación:** `server/routes/users/bandasDisponibles.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Bandas que ve un usuario en el selector (propias, compartidas y registradas) y normalización de band_id para compararlas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[server_routes_users_permisosCuenta|server/routes/users/permisosCuenta.ts]] *(from #route)*
- [[server_routes_users_rutasBandas|server/routes/users/rutasBandas.ts]] *(from #route)*
- [[server_routes_users_rutasGoogle|server/routes/users/rutasGoogle.ts]] *(from #route)*
- [[server_routes_users_rutasLogin|server/routes/users/rutasLogin.ts]] *(from #route)*
- [[server_routes_users_rutasMiembrosEdicion|server/routes/users/rutasMiembrosEdicion.ts]] *(from #route)*
- [[server_routes_users_rutasPreferencias|server/routes/users/rutasPreferencias.ts]] *(from #route)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(from #route)*
- [[server_routes_users_rutasSalidaBanda|server/routes/users/rutasSalidaBanda.ts]] *(from #route)*
- [[server_routes_users_rutasSesion|server/routes/users/rutasSesion.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
