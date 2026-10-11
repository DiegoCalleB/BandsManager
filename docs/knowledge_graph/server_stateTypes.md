---
id: server_stateTypes
title: "server/stateTypes.ts"
layer: service
domain: system
file: "server/stateTypes.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/stateTypes.ts

> **Ubicación:** `server/stateTypes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Forma del estado local de la aplicación (data.json / caché en memoria de server/state.ts).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*
- [[server_auth|server/auth.ts]] *(from #security)*
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[server_db_users|server/db/users.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_tiposBilling|server/routes/tiposBilling.ts]] *(from #route)*
- [[server_routes_users_adminInicial|server/routes/users/adminInicial.ts]] *(from #route)*
- [[server_routes_users_bandasDisponibles|server/routes/users/bandasDisponibles.ts]] *(from #route)*
- [[server_routes_users_permisosCuenta|server/routes/users/permisosCuenta.ts]] *(from #route)*
- [[server_routes_users_rutasGoogle|server/routes/users/rutasGoogle.ts]] *(from #route)*
- [[server_routes_users_rutasLogin|server/routes/users/rutasLogin.ts]] *(from #route)*
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(from #route)*
- [[server_routes_users_rutasRecuperacion|server/routes/users/rutasRecuperacion.ts]] *(from #route)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(from #route)*
- [[server_routes_users_rutasSesion|server/routes/users/rutasSesion.ts]] *(from #route)*
- [[server_utils_templateOptimizer|server/utils/templateOptimizer.ts]] *(from #service)*
- [[server_utils_tiposBandDna|server/utils/tiposBandDna.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
