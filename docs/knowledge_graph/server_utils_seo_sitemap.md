---
id: server_utils_seo_sitemap
title: "server/utils/seo/sitemap.ts"
layer: service
domain: system
file: "server/utils/seo/sitemap.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/sitemap.ts

> **Ubicación:** `server/utils/seo/sitemap.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Entradas del sitemap de las páginas de SEO: cada par es/en declara sus alternativas recíprocas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_datos|server/utils/seo/festivales/datos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_vigencia|server/utils/seo/festivales/vigencia.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_textos|server/utils/seo/textos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/festivales.test.ts`
- `server/utils/seo/__tests__/guias.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
