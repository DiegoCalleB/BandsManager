---
id: server_services_venueEventsRadarService
title: "server/services/venueEventsRadarService.ts"
layer: service
domain: booking
file: "server/services/venueEventsRadarService.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/venueEventsRadarService.ts

> **Ubicación:** `server/services/venueEventsRadarService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
VENUE EVENTS & AVAILABILITY RADAR (WEGOW / BANDSINTOWN / SONGKICK / TICKETING)

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_jinaReaderService|server/services/jinaReaderService.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[server_services_campaignRadarScheduler|server/services/campaignRadarScheduler.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
