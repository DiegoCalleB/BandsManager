---
id: server_services_catalogoScheduler
title: "server/services/catalogoScheduler.ts"
layer: service
domain: system
file: "server/services/catalogoScheduler.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/catalogoScheduler.ts

> **Ubicación:** `server/services/catalogoScheduler.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Sincronización periódica del catálogo compartido de salas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_consultaMapsSala|server/services/consultaMapsSala.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_enriquecerSalasDesdeSuWeb|server/services/enriquecerSalasDesdeSuWeb.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_geolocalizarSalas|server/services/geolocalizarSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_importarSalasBandflow|server/services/importarSalasBandflow.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_importarSalasOsm|server/services/importarSalasOsm.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_leerWebDeSala|server/services/leerWebDeSala.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_verificarSalasEnMaps|server/services/verificarSalasEnMaps.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_datosDeWebSala|server/utils/datosDeWebSala.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/catalogoScheduler.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
