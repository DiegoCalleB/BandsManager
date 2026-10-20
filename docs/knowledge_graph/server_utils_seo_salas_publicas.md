---
id: server_utils_seo_salas_publicas
title: "server/utils/seo/salas/publicas.ts"
layer: service
domain: system
file: "server/utils/seo/salas/publicas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/salas/publicas.ts

> **Ubicación:** `server/utils/seo/salas/publicas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Reglas de publicación del directorio de salas y su agrupación por zona. Puro y probado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_geoEspana|server/utils/geoEspana.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_tipos|server/utils/seo/salas/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_salasPublicas|server/db/salasPublicas.ts]] *(from #db)*
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*
- [[server_utils_seo_rastreadores|server/utils/seo/rastreadores.ts]] *(from #service)*
- [[server_utils_seo_salas_render|server/utils/seo/salas/render.ts]] *(from #service)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/salas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
