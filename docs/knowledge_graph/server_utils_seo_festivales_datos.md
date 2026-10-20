---
id: server_utils_seo_festivales_datos
title: "server/utils/seo/festivales/datos.ts"
layer: service
domain: system
file: "server/utils/seo/festivales/datos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/festivales/datos.ts

> **Ubicación:** `server/utils/seo/festivales/datos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Fichas del directorio de festivales. Añadir una = abrir un pull request con la ficha y su fuente.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_festivalesPublicos|server/services/festivalesPublicos.ts]] *(from #service)*
- [[server_utils_seo_festivales_render|server/utils/seo/festivales/render.ts]] *(from #service)*
- [[server_utils_seo_rastreadores|server/utils/seo/rastreadores.ts]] *(from #service)*
- [[server_utils_seo_sitemap|server/utils/seo/sitemap.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/festivales.test.ts`
- `server/utils/seo/__tests__/festivalesDb.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
