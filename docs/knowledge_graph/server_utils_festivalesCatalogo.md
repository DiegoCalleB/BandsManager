---
id: server_utils_festivalesCatalogo
title: "server/utils/festivalesCatalogo.ts"
layer: service
domain: system
file: "server/utils/festivalesCatalogo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/festivalesCatalogo.ts

> **Ubicación:** `server/utils/festivalesCatalogo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Los festivales del directorio público vistos desde el catálogo de la banda: consulta y alta en su agenda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_logoDeSala|src/utils/logoDeSala.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_catalogo|server/routes/catalogo.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/festivalesCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
