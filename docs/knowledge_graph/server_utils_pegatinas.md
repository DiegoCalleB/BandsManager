---
id: server_utils_pegatinas
title: "server/utils/pegatinas.ts"
layer: service
domain: system
file: "server/utils/pegatinas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/pegatinas.ts

> **Ubicación:** `server/utils/pegatinas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Regalo de pegatinas en la primera suscripción de pago. Puro (sin red ni BD) para poder probarlo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_pegatinas|server/db/pegatinas.ts]] *(from #db)*
- [[server_routes_pegatinas|server/routes/pegatinas.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/pegatinas.test.ts`
- `src/components/landing/__tests__/PreciosTfm.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
