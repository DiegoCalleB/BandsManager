---
id: server_routes_interesados
title: "server/routes/interesados.ts"
layer: route
domain: system
file: "server/routes/interesados.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/interesados.ts

> **Ubicación:** `server/routes/interesados.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Lista de novedades de la landing oficial, con doble confirmación (sin sesión).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_interesados|server/db/interesados.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_interesados|server/routes/interesados.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_interesados|server/utils/interesados.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_trackingSeguro|server/utils/trackingSeguro.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server_routes_interesados|server/routes/interesados.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[src_components_landing_FormularioInteres|src/components/landing/FormularioInteres.tsx]] *(from #frontend)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
