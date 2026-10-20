---
id: server_utils_seo_festivales_tipos
title: "server/utils/seo/festivales/tipos.ts"
layer: service
domain: system
file: "server/utils/seo/festivales/tipos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/festivales/tipos.ts

> **Ubicación:** `server/utils/seo/festivales/tipos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Festivales del directorio público. Los datos viven en el repositorio y entran por revisión (pull request):

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_festivales|server/db/festivales.ts]] *(from #db)*
- [[server_utils_festivalesCatalogo|server/utils/festivalesCatalogo.ts]] *(from #service)*
- [[server_utils_seo_festivales_datos|server/utils/seo/festivales/datos.ts]] *(from #service)*
- [[server_utils_seo_festivales_importar|server/utils/seo/festivales/importar.ts]] *(from #service)*
- [[server_utils_seo_festivales_mapeo|server/utils/seo/festivales/mapeo.ts]] *(from #service)*
- [[server_utils_seo_festivales_proveedor|server/utils/seo/festivales/proveedor.ts]] *(from #service)*
- [[server_utils_seo_festivales_render|server/utils/seo/festivales/render.ts]] *(from #service)*
- [[server_utils_seo_festivales_semilla|server/utils/seo/festivales/semilla.ts]] *(from #service)*
- [[server_utils_seo_festivales_textos|server/utils/seo/festivales/textos.ts]] *(from #service)*
- [[server_utils_seo_festivales_vigencia|server/utils/seo/festivales/vigencia.ts]] *(from #service)*
- [[server_utils_seo_rastreadores|server/utils/seo/rastreadores.ts]] *(from #service)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/festivalesCatalogo.test.ts`
- `server/utils/seo/__tests__/festivales.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
