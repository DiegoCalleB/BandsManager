---
id: server_utils_seo_festivales_mapeo
title: "server/utils/seo/festivales/mapeo.ts"
layer: service
domain: system
file: "server/utils/seo/festivales/mapeo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/festivales/mapeo.ts

> **Ubicación:** `server/utils/seo/festivales/mapeo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
De las filas de Supabase (`catalogo_festivales`, `catalogo_festival_ediciones`, `catalogo_festival_convocatorias`) a la ficha pública. Puro y probado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_festivales|server/db/festivales.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/migrations/__tests__/catalogoGenerosFestival.test.ts`
- `server/utils/seo/__tests__/festivalesDb.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
