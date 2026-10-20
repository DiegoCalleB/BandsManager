---
id: server_utils_seo_salas_tipos
title: "server/utils/seo/salas/tipos.ts"
layer: service
domain: system
file: "server/utils/seo/salas/tipos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/salas/tipos.ts

> **Ubicación:** `server/utils/seo/salas/tipos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Directorio público de salas de conciertos de España. Sale del catálogo compartido (ADR 0044) pero solo con lo PÚBLICO

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_salasPublicas|server/db/salasPublicas.ts]] *(from #db)*
- [[server_services_salasPublicas|server/services/salasPublicas.ts]] *(from #service)*
- [[server_utils_seo_rastreadores|server/utils/seo/rastreadores.ts]] *(from #service)*
- [[server_utils_seo_salas_publicas|server/utils/seo/salas/publicas.ts]] *(from #service)*
- [[server_utils_seo_salas_render|server/utils/seo/salas/render.ts]] *(from #service)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/rastreadores.test.ts`
- `server/utils/seo/__tests__/salas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
