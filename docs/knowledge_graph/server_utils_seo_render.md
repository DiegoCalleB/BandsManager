---
id: server_utils_seo_render
title: "server/utils/seo/render.ts"
layer: service
domain: system
file: "server/utils/seo/render.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/render.ts

> **Ubicación:** `server/utils/seo/render.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Renderizador de las guías de SEO (`/guias`, `/en/guides` y sus guías), en el servidor y sin I/O.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_estilos|server/utils/seo/estilos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_textos|server/utils/seo/textos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_tipos|server/utils/seo/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/guias.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
