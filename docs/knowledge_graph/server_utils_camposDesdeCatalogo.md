---
id: server_utils_camposDesdeCatalogo
title: "server/utils/camposDesdeCatalogo.ts"
layer: service
domain: system
file: "server/utils/camposDesdeCatalogo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/camposDesdeCatalogo.ts

> **Ubicación:** `server/utils/camposDesdeCatalogo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Un lead de una sala que el catálogo compartido ya conoce se completa con lo que otras bandas encontraron: web,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/camposDesdeCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
