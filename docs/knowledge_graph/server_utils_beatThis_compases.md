---
id: server_utils_beatThis_compases
title: "server/utils/beatThis/compases.ts"
layer: service
domain: system
file: "server/utils/beatThis/compases.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/beatThis/compases.ts

> **Ubicación:** `server/utils/beatThis/compases.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
De la salida de Beat This! a un pulso listo para dibujar compases. La red marca bien los tiempos,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_beatThis_beatThis|server/utils/beatThis/beatThis.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_pulso|server/utils/pulso.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/beatThis/__tests__/compases.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
