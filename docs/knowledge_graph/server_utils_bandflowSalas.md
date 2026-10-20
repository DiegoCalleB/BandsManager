---
id: server_utils_bandflowSalas
title: "server/utils/bandflowSalas.ts"
layer: service
domain: system
file: "server/utils/bandflowSalas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/bandflowSalas.ts

> **Ubicación:** `server/utils/bandflowSalas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Salas de Bandflow (directorio colaborativo de salas, bandflow.es) a partir de lo que muestra su ficha pública: reglas

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_regionesEspana|server/utils/regionesEspana.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/bandflowSalas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
