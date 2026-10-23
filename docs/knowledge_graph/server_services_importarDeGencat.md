---
id: server_services_importarDeGencat
title: "server/services/importarDeGencat.ts"
layer: service
domain: system
file: "server/services/importarDeGencat.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/importarDeGencat.ts

> **Ubicación:** `server/services/importarDeGencat.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Importación de las salas de Cataluña (datos abiertos de la Generalitat) al catálogo compartido, con la importación común de fuentes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_importarDeFuente|server/services/importarDeFuente.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_gencatSalas|server/utils/gencatSalas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
