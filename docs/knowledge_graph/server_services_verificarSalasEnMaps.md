---
id: server_services_verificarSalasEnMaps
title: "server/services/verificarSalasEnMaps.ts"
layer: service
domain: system
file: "server/services/verificarSalasEnMaps.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/verificarSalasEnMaps.ts

> **Ubicación:** `server/services/verificarSalasEnMaps.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Verificación periódica de las salas del catálogo en Google Maps: ¿siguen abiertas?

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_estadoNegocio|server/utils/estadoNegocio.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*
- [[server_services_consultaMapsSala|server/services/consultaMapsSala.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/verificarSalasEnMaps.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
