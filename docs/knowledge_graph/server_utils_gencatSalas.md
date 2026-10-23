---
id: server_utils_gencatSalas
title: "server/utils/gencatSalas.ts"
layer: service
domain: system
file: "server/utils/gencatSalas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/gencatSalas.ts

> **Ubicación:** `server/utils/gencatSalas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Salas de Cataluña del conjunto «Equipaments culturals de Catalunya» (Departament de Cultura de la Generalitat, datos abiertos):

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_importarDeFuente|server/services/importarDeFuente.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_importarDeGencat|server/services/importarDeGencat.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/gencatSalas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
