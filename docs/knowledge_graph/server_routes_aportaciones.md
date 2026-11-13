---
id: server_routes_aportaciones
title: "server/routes/aportaciones.ts"
layer: route
domain: system
file: "server/routes/aportaciones.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/aportaciones.ts

> **Ubicación:** `server/routes/aportaciones.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Aportaciones del público al directorio de festivales (sin sesión):

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_aportaciones|server/db/aportaciones.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_aportaciones|server/routes/aportaciones.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_festivalesPublicos|server/services/festivalesPublicos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_aportaciones|server/utils/aportaciones.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server_routes_aportaciones|server/routes/aportaciones.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_utils_seo_festivales_render|server/utils/seo/festivales/render.ts]] *(from #service)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
