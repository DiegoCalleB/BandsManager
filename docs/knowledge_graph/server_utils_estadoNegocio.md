---
id: server_utils_estadoNegocio
title: "server/utils/estadoNegocio.ts"
layer: service
domain: system
file: "server/utils/estadoNegocio.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/estadoNegocio.ts

> **Ubicación:** `server/utils/estadoNegocio.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Estado del negocio de una sala según Google Maps: reglas puras.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(from #service)*
- [[server_services_consultaMapsSala|server/services/consultaMapsSala.ts]] *(from #service)*
- [[server_services_verificarSalasEnMaps|server/services/verificarSalasEnMaps.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/verificarSalasEnMaps.test.ts`
- `server/utils/__tests__/estadoNegocio.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
