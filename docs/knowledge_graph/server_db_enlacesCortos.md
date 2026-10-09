---
id: server_db_enlacesCortos
title: "server/db/enlacesCortos.ts"
layer: db
domain: system
file: "server/db/enlacesCortos.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/enlacesCortos.ts

> **Ubicación:** `server/db/enlacesCortos.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Enlaces cortos (`short_links`) y sus clics (`short_link_clicks`). Toda lectura/escritura de una

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_enlacesCortos|server/utils/enlacesCortos.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_short_link_clicks|tabla short_link_clicks]] *(Layer: #schema, Domain: #system)*
- [[tabla_short_links|tabla short_links]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/enlacesCortos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
