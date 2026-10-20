---
id: server_utils_seo_rastreadores
title: "server/utils/seo/rastreadores.ts"
layer: service
domain: system
file: "server/utils/seo/rastreadores.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/rastreadores.ts

> **Ubicación:** `server/utils/seo/rastreadores.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lo que leen los rastreadores y los buscadores con IA: `robots.txt` y `llms.txt`. Puro, sin red ni base de datos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_seo_festivales_datos|server/utils/seo/festivales/datos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_vigencia|server/utils/seo/festivales/vigencia.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_publicas|server/utils/seo/salas/publicas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_tipos|server/utils/seo/salas/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/rastreadores.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
