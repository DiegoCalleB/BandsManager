---
id: server_services_perfilPublicoBanda
title: "server/services/perfilPublicoBanda.ts"
layer: service
domain: system
file: "server/services/perfilPublicoBanda.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/perfilPublicoBanda.ts

> **Ubicación:** `server/services/perfilPublicoBanda.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Perfil público de una banda para las superficies sin sesión (página de concierto, insignia del

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_db_referidos|server/db/referidos.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_enlacesCortos|server/utils/enlacesCortos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_perfilBanda|server/utils/perfilBanda.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_referidos|server/utils/referidos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
