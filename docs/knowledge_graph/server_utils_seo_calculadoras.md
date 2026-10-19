---
id: server_utils_seo_calculadoras
title: "server/utils/seo/calculadoras.ts"
layer: service
domain: system
file: "server/utils/seo/calculadoras.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/calculadoras.ts

> **Ubicación:** `server/utils/seo/calculadoras.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Calculadoras de las guías. La fórmula vive en una función pura y se usa en dos sitios con el mismo código:

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_tipos|server/utils/seo/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/calculadoras.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
