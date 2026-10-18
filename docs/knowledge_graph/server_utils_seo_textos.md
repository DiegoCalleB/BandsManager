---
id: server_utils_seo_textos
title: "server/utils/seo/textos.ts"
layer: service
domain: system
file: "server/utils/seo/textos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/textos.ts

> **Ubicación:** `server/utils/seo/textos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Textos de interfaz de las páginas de SEO (el contenido de cada guía vive en sus propios ficheros).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_paginaRider|server/utils/paginaRider.ts]] *(from #service)*
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(from #service)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(from #service)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(from #service)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/guias.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
