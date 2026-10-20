---
id: server_utils_seo_salas_render
title: "server/utils/seo/salas/render.ts"
layer: service
domain: system
file: "server/utils/seo/salas/render.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/salas/render.ts

> **Ubicación:** `server/utils/seo/salas/render.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Páginas públicas del directorio de salas (`/directories/venues…`): HTML completo en servidor, sin I/O.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_estilos|server/utils/seo/estilos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_publicas|server/utils/seo/salas/publicas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_textos|server/utils/seo/salas/textos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_tipos|server/utils/seo/salas/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_textos|server/utils/seo/textos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/rastreadores.test.ts`
- `server/utils/seo/__tests__/salas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
