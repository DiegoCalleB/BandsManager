---
id: server_utils_aportaciones
title: "server/utils/aportaciones.ts"
layer: service
domain: system
file: "server/utils/aportaciones.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/aportaciones.ts

> **Ubicación:** `server/utils/aportaciones.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Aportaciones del público al directorio: validación pura (lista blanca de campos, longitudes, URL y email).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_aportaciones|server/db/aportaciones.ts]] *(from #db)*
- [[server_routes_aportaciones|server/routes/aportaciones.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/aportaciones.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
