---
id: fn_gira
title: "Tour Manager"
layer: feature
domain: booking
file: "src/components/TourManager.tsx"
tags: ["feature", "booking", "auto"]
---

# 📌 Tour Manager

> **Ubicación:** `src/components/TourManager.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/booking`

## 📖 Descripción
Planificación de giras, logística y rutas entre bolos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_controllers_tours_controller|server/controllers/tours.controller.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tours|server/db/tours.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_tours|server/routes/tours.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_tourLogisticsService|server/services/tourLogisticsService.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_TourManager|src/components/TourManager.tsx]] *(Layer: #frontend, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_tours|tabla tours]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
