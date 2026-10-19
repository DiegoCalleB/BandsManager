---
id: server_services_festivalesPublicos
title: "server/services/festivalesPublicos.ts"
layer: service
domain: system
file: "server/services/festivalesPublicos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/festivalesPublicos.ts

> **Ubicación:** `server/services/festivalesPublicos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Proveedor de las fichas públicas de festivales: base de datos con respaldo en las fichas fijas (ver crearProveedorFestivales).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_festivales|server/db/festivales.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_datos|server/utils/seo/festivales/datos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_proveedor|server/utils/seo/festivales/proveedor.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
