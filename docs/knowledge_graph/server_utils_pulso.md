---
id: server_utils_pulso
title: "server/utils/pulso.ts"
layer: service
domain: system
file: "server/utils/pulso.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/pulso.ts

> **Ubicación:** `server/utils/pulso.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Pulso (tempo y posición de los tiempos) deducido del propio audio, sin modelos ni servicios:

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_refinarFronteras|server/utils/refinarFronteras.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/chordDetection.realista.test.ts`
- `server/utils/__tests__/pulso.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
