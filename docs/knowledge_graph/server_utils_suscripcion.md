---
id: server_utils_suscripcion
title: "server/utils/suscripcion.ts"
layer: service
domain: system
file: "server/utils/suscripcion.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/suscripcion.ts

> **Ubicación:** `server/utils/suscripcion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Interruptor por banda de la suscripción de pago (`registered_bands.suscripcion_habilitada`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[server_utils_bookingHabilitado|server/utils/bookingHabilitado.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/suscripcion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
