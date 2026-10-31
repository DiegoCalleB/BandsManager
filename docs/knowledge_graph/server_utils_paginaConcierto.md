---
id: server_utils_paginaConcierto
title: "server/utils/paginaConcierto.ts"
layer: service
domain: system
file: "server/utils/paginaConcierto.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/paginaConcierto.ts

> **Ubicación:** `server/utils/paginaConcierto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Página pública de un concierto (`/e/<slug>`), generada en el servidor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_enlacesCortos|server/utils/enlacesCortos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_slug|server/utils/slug.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_services_asesorInstagram|server/services/asesorInstagram.ts]] *(from #service)*
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[server_services_asesorRedes|server/services/asesorRedes.ts]] *(from #service)*
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(from #service)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/paginaConcierto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
