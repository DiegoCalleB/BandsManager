---
id: server_utils_geocodificacion
title: "server/utils/geocodificacion.ts"
layer: service
domain: system
file: "server/utils/geocodificacion.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/geocodificacion.ts

> **Ubicación:** `server/utils/geocodificacion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Coordenadas de una sala a partir del geocodificador de OpenStreetMap (Nominatim, ODbL): reglas puras, sin red.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_geolocalizarSalas|server/services/geolocalizarSalas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/geocodificacion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
