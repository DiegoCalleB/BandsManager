---
id: server_utils_seo_rutas
title: "server/utils/seo/rutas.ts"
layer: service
domain: system
file: "server/utils/seo/rutas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/rutas.ts

> **Ubicación:** `server/utils/seo/rutas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Rutas públicas de SEO por idioma. Los tramos de la URL de los directorios van en inglés en los dos idiomas; las páginas

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*
- [[server_utils_paginaRider|server/utils/paginaRider.ts]] *(from #service)*
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(from #service)*
- [[server_utils_seo_calculadoras|server/utils/seo/calculadoras.ts]] *(from #service)*
- [[server_utils_seo_festivales_render|server/utils/seo/festivales/render.ts]] *(from #service)*
- [[server_utils_seo_festivales_textos|server/utils/seo/festivales/textos.ts]] *(from #service)*
- [[server_utils_seo_figuras|server/utils/seo/figuras.ts]] *(from #service)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(from #service)*
- [[server_utils_seo_listados|server/utils/seo/listados.ts]] *(from #service)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(from #service)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*
- [[server_utils_seo_textos|server/utils/seo/textos.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/festivales.test.ts`
- `server/utils/seo/__tests__/guias.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
