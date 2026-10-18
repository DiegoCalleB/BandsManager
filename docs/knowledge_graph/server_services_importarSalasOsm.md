---
id: server_services_importarSalasOsm
title: "server/services/importarSalasOsm.ts"
layer: service
domain: system
file: "server/services/importarSalasOsm.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/importarSalasOsm.ts

> **Ubicación:** `server/services/importarSalasOsm.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Importación de las salas de España desde OpenStreetMap al catálogo compartido.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_osmSalas|server/utils/osmSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/importarSalasOsm.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
