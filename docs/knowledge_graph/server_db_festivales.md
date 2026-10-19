---
id: server_db_festivales
title: "server/db/festivales.ts"
layer: db
domain: system
file: "server/db/festivales.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/festivales.ts

> **Ubicación:** `server/db/festivales.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Directorio de festivales: lectura de las tres tablas (`festivales`, `festival_ediciones`, `festival_convocatorias`) y escritura de la carga.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_seo_festivales_mapeo|server/utils/seo/festivales/mapeo.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_services_festivalesPublicos|server/services/festivalesPublicos.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
