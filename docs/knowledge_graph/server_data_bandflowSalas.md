---
id: server_data_bandflowSalas
title: "server/data/bandflowSalas.ts"
layer: service
domain: system
file: "server/data/bandflowSalas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/data/bandflowSalas.ts

> **Ubicación:** `server/data/bandflowSalas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SALAS_BANDFLOW.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_importarSalasBandflow|server/services/importarSalasBandflow.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/data/__tests__/bandflowSalas.test.ts`
- `server/services/__tests__/importarSalasBandflow.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
