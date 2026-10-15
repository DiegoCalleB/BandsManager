---
id: server_utils_guardadoParcial
title: "server/utils/guardadoParcial.ts"
layer: service
domain: system
file: "server/utils/guardadoParcial.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/guardadoParcial.ts

> **Ubicación:** `server/utils/guardadoParcial.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Guardado parcial: cuando la BD no tiene alguna columna (migración sin aplicar) el servidor

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/tolerantWrite.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
