---
id: server_services_buscarWebsDeSalas
title: "server/services/buscarWebsDeSalas.ts"
layer: service
domain: system
file: "server/services/buscarWebsDeSalas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/buscarWebsDeSalas.ts

> **Ubicación:** `server/services/buscarWebsDeSalas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Busca la web oficial de las fichas del catálogo que no la tienen (salas, festivales, teatros, discotecas…), para que el lector

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_webOficial|server/utils/webOficial.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/buscarWebsDeSalas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
