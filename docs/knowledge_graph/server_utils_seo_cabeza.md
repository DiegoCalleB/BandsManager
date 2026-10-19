---
id: server_utils_seo_cabeza
title: "server/utils/seo/cabeza.ts"
layer: service
domain: system
file: "server/utils/seo/cabeza.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/cabeza.ts

> **Ubicación:** `server/utils/seo/cabeza.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
`<head>` y barra superior comunes a las páginas de SEO, con `hreflang` y `og:locale` por idioma.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_estilos|server/utils/seo/estilos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_textos|server/utils/seo/textos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_paginaRider|server/utils/paginaRider.ts]] *(from #service)*
- [[server_utils_seo_festivales_render|server/utils/seo/festivales/render.ts]] *(from #service)*
- [[server_utils_seo_listados|server/utils/seo/listados.ts]] *(from #service)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
