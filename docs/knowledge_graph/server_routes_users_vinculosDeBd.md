---
id: server_routes_users_vinculosDeBd
title: "server/routes/users/vinculosDeBd.ts"
layer: route
domain: system
file: "server/routes/users/vinculosDeBd.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/users/vinculosDeBd.ts

> **Ubicación:** `server/routes/users/vinculosDeBd.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Vínculos usuario↔banda de la tabla `user_bands` de Supabase, traídos al estado en memoria.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_users_bandasDisponibles|server/routes/users/bandasDisponibles.ts]] *(Layer: #route, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[server_routes_users_rutasLogin|server/routes/users/rutasLogin.ts]] *(from #route)*
- [[server_routes_users_rutasSesion|server/routes/users/rutasSesion.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/vinculosDeBd.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
