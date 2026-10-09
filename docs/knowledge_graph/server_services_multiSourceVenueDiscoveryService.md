---
id: server_services_multiSourceVenueDiscoveryService
title: "server/services/multiSourceVenueDiscoveryService.ts"
layer: service
domain: booking
file: "server/services/multiSourceVenueDiscoveryService.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/multiSourceVenueDiscoveryService.ts

> **Ubicación:** `server/services/multiSourceVenueDiscoveryService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
MULTI-SOURCE VENUE & FESTIVAL DISCOVERY SERVICE

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_musicbrainzVenueService|server/services/musicbrainzVenueService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[server_services_similarBandsVenueMatcherService|server/services/similarBandsVenueMatcherService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
