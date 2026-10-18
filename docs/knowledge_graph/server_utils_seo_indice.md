---
id: server_utils_seo_indice
title: "server/utils/seo/indice.ts"
layer: service
domain: system
file: "server/utils/seo/indice.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/indice.ts

> **Ubicación:** `server/utils/seo/indice.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Registro de las guías de SEO. Añadir una guía = añadirla a uno de los ficheros de contenido.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_paginaRider|server/utils/paginaRider.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_guiasBooking|server/utils/seo/guiasBooking.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_seo_guiasDirecto|server/utils/seo/guiasDirecto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_guiasNegocio|server/utils/seo/guiasNegocio.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_tipos|server/utils/seo/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/guias.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
