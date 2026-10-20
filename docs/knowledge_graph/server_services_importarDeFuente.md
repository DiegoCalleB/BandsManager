---
id: server_services_importarDeFuente
title: "server/services/importarDeFuente.ts"
layer: service
domain: system
file: "server/services/importarDeFuente.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/importarDeFuente.ts

> **Ubicación:** `server/services/importarDeFuente.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Importación al catálogo de las fichas de una fuente externa (Wikidata, directorios…), con las mismas reglas para todas:

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_osmSalas|server/utils/osmSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_importarDeWikidata|server/services/importarDeWikidata.ts]] *(from #service)*
- [[server_utils_wikidataSalas|server/utils/wikidataSalas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/importarDeFuente.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
