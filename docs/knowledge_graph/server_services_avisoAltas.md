---
id: server_services_avisoAltas
title: "server/services/avisoAltas.ts"
layer: service
domain: system
file: "server/services/avisoAltas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/avisoAltas.ts

> **Ubicación:** `server/services/avisoAltas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: avisarAlta.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_avisoAltas|server/utils/avisoAltas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_contactoEmpresas|server/routes/contactoEmpresas.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_interesados|server/routes/interesados.ts]] *(from #route)*
- [[server_routes_pegatinas|server/routes/pegatinas.ts]] *(from #route)*
- [[server_routes_users_rutasGoogle|server/routes/users/rutasGoogle.ts]] *(from #route)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
