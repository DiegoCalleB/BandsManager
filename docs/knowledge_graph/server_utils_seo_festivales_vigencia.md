---
id: server_utils_seo_festivales_vigencia
title: "server/utils/seo/festivales/vigencia.ts"
layer: service
domain: system
file: "server/utils/seo/festivales/vigencia.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/festivales/vigencia.ts

> **Ubicación:** `server/utils/seo/festivales/vigencia.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Reglas de frescura del directorio: puras y con la fecha de hoy como argumento para poder probarlas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*
- [[server_utils_seo_festivales_render|server/utils/seo/festivales/render.ts]] *(from #service)*
- [[server_utils_seo_rastreadores|server/utils/seo/rastreadores.ts]] *(from #service)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/festivales.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
