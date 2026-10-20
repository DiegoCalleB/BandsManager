---
id: server_services_geolocalizarSalas
title: "server/services/geolocalizarSalas.ts"
layer: service
domain: system
file: "server/services/geolocalizarSalas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/geolocalizarSalas.ts

> **Ubicación:** `server/services/geolocalizarSalas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Pone coordenadas a las salas del catálogo que no las tienen (las de Bandflow, las de las bandas y las de OSM sin punto).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_geocodificacion|server/utils/geocodificacion.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/geolocalizarSalas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
