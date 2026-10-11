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
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
