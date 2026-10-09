---
id: server_services_googlePlacesVenueService
title: "server/services/googlePlacesVenueService.ts"
layer: service
domain: booking
file: "server/services/googlePlacesVenueService.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/googlePlacesVenueService.ts

> **Ubicación:** `server/services/googlePlacesVenueService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
GOOGLE PLACES & VENUE TECHNICAL INSPECTION SERVICE

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
