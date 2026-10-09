---
id: server_utils_emailDeliveryTracker
title: "server/utils/emailDeliveryTracker.ts"
layer: service
domain: system
file: "server/utils/emailDeliveryTracker.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/emailDeliveryTracker.ts

> **Ubicación:** `server/utils/emailDeliveryTracker.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Rastreo de fallos de entrega de email

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/emailDeliveryTracker.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
