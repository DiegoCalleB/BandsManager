---
id: server_utils_regionesEspana
title: "server/utils/regionesEspana.ts"
layer: service
domain: system
file: "server/utils/regionesEspana.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/regionesEspana.ts

> **Ubicación:** `server/utils/regionesEspana.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Comunidad autónoma a partir del código postal español: sus dos primeras cifras son la provincia.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_geoEspana|server/utils/geoEspana.ts]] *(from #service)*
- [[server_utils_osmSalas|server/utils/osmSalas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/osmSalas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
