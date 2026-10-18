---
id: server_services_referenciasCartel
title: "server/services/referenciasCartel.ts"
layer: service
domain: system
file: "server/services/referenciasCartel.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/referenciasCartel.ts

> **Ubicación:** `server/services/referenciasCartel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Imágenes de referencia de la banda para la IA: se leen de SU carpeta de nuestro almacenamiento

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_cartelUrl|server/utils/cartelUrl.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_adn|src/utils/cartel/adn.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[server_services_briefCartel|server/services/briefCartel.ts]] *(from #service)*
- [[server_services_imagenCartel|server/services/imagenCartel.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/referenciasCartel.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
