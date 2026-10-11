---
id: server_routes_users_permisosCuenta
title: "server/routes/users/permisosCuenta.ts"
layer: route
domain: system
file: "server/routes/users/permisosCuenta.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/permisosCuenta.ts

> **Ubicación:** `server/routes/users/permisosCuenta.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Quién puede restablecer la contraseña de quién: solo un líder sobre miembros exclusivos de su banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_routes_users_bandasDisponibles|server/routes/users/bandasDisponibles.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server_routes_users_rutasMiembrosEdicion|server/routes/users/rutasMiembrosEdicion.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
