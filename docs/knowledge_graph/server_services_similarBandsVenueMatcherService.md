---
id: server_services_similarBandsVenueMatcherService
title: "server/services/similarBandsVenueMatcherService.ts"
layer: service
domain: booking
file: "server/services/similarBandsVenueMatcherService.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/similarBandsVenueMatcherService.ts

> **Ubicación:** `server/services/similarBandsVenueMatcherService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
SIMILAR BANDS VENUE MATCHER SERVICE ("Efecto Espejo" / Setlist.fm & Spotify Similar Artists)

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_bandsintownVenueService|server/services/bandsintownVenueService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_multiSourceVenueDiscoveryService|server/services/multiSourceVenueDiscoveryService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
