---
id: server_utils_bandaRegistrada
title: "server/utils/bandaRegistrada.ts"
layer: service
domain: system
file: "server/utils/bandaRegistrada.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/bandaRegistrada.ts

> **Ubicación:** `server/utils/bandaRegistrada.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Busca el registro de una banda por su id sin confundir ids gemelos (`mi-banda` y `band-mi-banda`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[server_routes_users_rutasSesion|server/routes/users/rutasSesion.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/bandaRegistrada.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
