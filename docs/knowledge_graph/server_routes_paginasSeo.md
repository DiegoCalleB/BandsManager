---
id: server_routes_paginasSeo
title: "server/routes/paginasSeo.ts"
layer: route
domain: system
file: "server/routes/paginasSeo.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/paginasSeo.ts

> **Ubicación:** `server/routes/paginasSeo.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Guías públicas de SEO: /guias (índice) y /guias/:slug. Contenido fijo en server/utils/seo/, sin datos de bandas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
