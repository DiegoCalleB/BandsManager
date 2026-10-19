---
id: server_services_salasPublicas
title: "server/services/salasPublicas.ts"
layer: service
domain: system
file: "server/services/salasPublicas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/salasPublicas.ts

> **Ubicación:** `server/services/salasPublicas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Proveedor de las salas del directorio público: base de datos con caché. Si Supabase falla se sigue sirviendo la última lectura buena.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_salasPublicas|server/db/salasPublicas.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_tipos|server/utils/seo/salas/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/salas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
