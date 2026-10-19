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
Guías y directorio de festivales de SEO: /guides y /en/guides (índices) y /guides/:slug y /en/guides/:slug. Contenido fijo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_festivalesPublicos|server/services/festivalesPublicos.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_salasPublicas|server/services/salasPublicas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_render|server/utils/seo/festivales/render.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_vigencia|server/utils/seo/festivales/vigencia.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_listados|server/utils/seo/listados.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_publicas|server/utils/seo/salas/publicas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_render|server/utils/seo/salas/render.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/paginasSeo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
