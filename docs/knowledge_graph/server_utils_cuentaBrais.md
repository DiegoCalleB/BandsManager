---
id: server_utils_cuentaBrais
title: "server/utils/cuentaBrais.ts"
layer: service
domain: system
file: "server/utils/cuentaBrais.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/cuentaBrais.ts

> **Ubicación:** `server/utils/cuentaBrais.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
¿Es esta la cuenta de Brais (mouredev)? Decide si se le dan por defecto las bandas del

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_auth|server/auth.ts]] *(from #security)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/cuentaBrais.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
