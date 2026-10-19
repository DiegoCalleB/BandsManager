---
id: server_utils_seo_festivales_render
title: "server/utils/seo/festivales/render.ts"
layer: service
domain: system
file: "server/utils/seo/festivales/render.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/festivales/render.ts

> **Ubicación:** `server/utils/seo/festivales/render.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Directorio público de festivales (`/festivales`, `/en/festivals`): HTML completo en servidor, sin I/O.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_estilos|server/utils/seo/estilos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_datos|server/utils/seo/festivales/datos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_textos|server/utils/seo/festivales/textos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_vigencia|server/utils/seo/festivales/vigencia.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_textos|server/utils/seo/textos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/festivales.test.ts`
- `server/utils/seo/__tests__/festivalesDb.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
