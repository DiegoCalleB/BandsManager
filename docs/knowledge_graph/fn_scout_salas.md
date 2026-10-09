---
id: fn_scout_salas
title: "Búsqueda de salas y festivales"
layer: feature
domain: booking
file: "src/components/VenueMap.tsx"
tags: ["feature", "booking", "auto"]
---

# 📌 Búsqueda de salas y festivales

> **Ubicación:** `src/components/VenueMap.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/booking`

## 📖 Descripción
Descubrimiento de salas, eventos y contactos desde fuentes abiertas, mapas y redes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_scout|Scout Discovery Agent]] *(Layer: #agent, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[ext_spotify|Spotify]] *(Layer: #external, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_bandsintownVenueService|server/services/bandsintownVenueService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_googlePlacesVenueService|server/services/googlePlacesVenueService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_multiSourceVenueDiscoveryService|server/services/multiSourceVenueDiscoveryService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_venueIntelligenceService|server/services/venueIntelligenceService.ts]] *(Layer: #service, Domain: #booking)*
- [[src_components_VenueMap|src/components/VenueMap.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[tabla_deleted_bands|tabla deleted_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_deleted_leads|tabla deleted_leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
