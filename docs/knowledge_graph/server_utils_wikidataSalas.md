---
id: server_utils_wikidataSalas
title: "server/utils/wikidataSalas.ts"
layer: service
domain: system
file: "server/utils/wikidataSalas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/wikidataSalas.ts

> **Ubicación:** `server/utils/wikidataSalas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Salas de conciertos y festivales de música de España desde Wikidata: reglas puras, sin red.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_importarDeFuente|server/services/importarDeFuente.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_importarDeWikidata|server/services/importarDeWikidata.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/wikidataSalas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
