---
id: server_utils_seo_listados
title: "server/utils/seo/listados.ts"
layer: service
domain: system
file: "server/utils/seo/listados.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/listados.ts

> **Ubicación:** `server/utils/seo/listados.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Portada de los listados (`/listados`, `/en/directories`): enlaza cada directorio público. Hoy solo festivales.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_textos|server/utils/seo/textos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/festivales.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
