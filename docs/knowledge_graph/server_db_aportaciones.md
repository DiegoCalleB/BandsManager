---
id: server_db_aportaciones
title: "server/db/aportaciones.ts"
layer: db
domain: system
file: "server/db/aportaciones.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/aportaciones.ts

> **Ubicación:** `server/db/aportaciones.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Aportaciones del público al directorio (`catalogo_aportaciones`): solo inserción desde el backend.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_aportaciones|server/utils/aportaciones.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_catalogo_aportaciones|tabla catalogo_aportaciones]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server_routes_aportaciones|server/routes/aportaciones.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
