---
id: server_routes_users_mezclaUsuarioBd
title: "server/routes/users/mezclaUsuarioBd.ts"
layer: route
domain: system
file: "server/routes/users/mezclaUsuarioBd.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/mezclaUsuarioBd.ts

> **Ubicación:** `server/routes/users/mezclaUsuarioBd.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Mezcla de la fila real de Supabase sobre el usuario que el servidor tiene en memoria.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server_routes_users_rutasLogin|server/routes/users/rutasLogin.ts]] *(from #route)*
- [[server_routes_users_rutasSesion|server/routes/users/rutasSesion.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/mezclaUsuarioBd.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
