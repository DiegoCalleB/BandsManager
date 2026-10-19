---
id: server_routes_paginaConcierto
title: "server/routes/paginaConcierto.ts"
layer: route
domain: system
file: "server/routes/paginaConcierto.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/paginaConcierto.ts

> **Ubicación:** `server/routes/paginaConcierto.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Páginas públicas indexables: /e/:slug (un concierto), /sitemap.xml y /robots.txt.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_enlacesCortos|server/db/enlacesCortos.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_contactoEmpresas|server/routes/contactoEmpresas.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_emailsCicloVida|server/routes/emailsCicloVida.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_fans_contador|server/routes/fans_contador.ts]] *(Layer: #route, Domain: #social)*
- [[server_routes_interesados|server/routes/interesados.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_pegatinas|server/routes/pegatinas.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_emailsCicloVida|server/services/emailsCicloVida.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_festivalesPublicos|server/services/festivalesPublicos.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_perfilPublicoBanda|server/services/perfilPublicoBanda.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandHash|server/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_cabeceraIdioma|server/utils/cabeceraIdioma.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_enlacesCortos|server/utils/enlacesCortos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_paginaRider|server/utils/paginaRider.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_referidos|server/utils/referidos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server|server.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/paginaConcierto.test.ts`
- `server/routes/__tests__/paginasSeo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
