---
id: server_services_importarSalasBandflow
title: "server/services/importarSalasBandflow.ts"
layer: service
domain: system
file: "server/services/importarSalasBandflow.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/importarSalasBandflow.ts

> **Ubicación:** `server/services/importarSalasBandflow.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Carga inicial al catálogo de las salas de Bandflow (bandflow.es), a partir de una semilla ya extraída y filtrada

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_data_bandflowSalas|server/data/bandflowSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_osmSalas|server/utils/osmSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/importarSalasBandflow.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
