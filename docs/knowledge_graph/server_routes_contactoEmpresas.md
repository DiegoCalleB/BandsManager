---
id: server_routes_contactoEmpresas
title: "server/routes/contactoEmpresas.ts"
layer: route
domain: system
file: "server/routes/contactoEmpresas.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/contactoEmpresas.ts

> **Ubicación:** `server/routes/contactoEmpresas.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Consultas de empresas para los planes B2B de la landing (sin sesión).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_interesados|server/db/interesados.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_contactoEmpresas|server/routes/contactoEmpresas.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_avisoAltas|server/services/avisoAltas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_contactoEmpresas|server/utils/contactoEmpresas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server_routes_contactoEmpresas|server/routes/contactoEmpresas.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[src_components_landing_FormularioEmpresas|src/components/landing/FormularioEmpresas.tsx]] *(from #frontend)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
