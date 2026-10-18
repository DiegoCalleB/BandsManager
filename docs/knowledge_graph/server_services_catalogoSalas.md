---
id: server_services_catalogoSalas
title: "server/services/catalogoSalas.ts"
layer: service
domain: system
file: "server/services/catalogoSalas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/catalogoSalas.ts

> **Ubicación:** `server/services/catalogoSalas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Sincronización del catálogo compartido de salas (fase 1).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/catalogoSalas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
