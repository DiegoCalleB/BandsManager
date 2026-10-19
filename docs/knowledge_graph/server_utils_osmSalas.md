---
id: server_utils_osmSalas
title: "server/utils/osmSalas.ts"
layer: service
domain: system
file: "server/utils/osmSalas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/osmSalas.ts

> **Ubicación:** `server/utils/osmSalas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Salas de España a partir de OpenStreetMap (datos abiertos, ODbL): reglas puras, sin red ni base de datos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_regionesEspana|server/utils/regionesEspana.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_importarSalasOsm|server/services/importarSalasOsm.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/importarSalasOsm.test.ts`
- `server/utils/__tests__/osmSalas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
