---
id: server_services_importarDeWikidata
title: "server/services/importarDeWikidata.ts"
layer: service
domain: system
file: "server/services/importarDeWikidata.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/importarDeWikidata.ts

> **Ubicación:** `server/services/importarDeWikidata.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Importación de salas de conciertos y festivales de España desde Wikidata (CC0) al catálogo compartido.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_importarDeFuente|server/services/importarDeFuente.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_wikidataSalas|server/utils/wikidataSalas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
