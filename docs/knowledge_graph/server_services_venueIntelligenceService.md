---
id: server_services_venueIntelligenceService
title: "server/services/venueIntelligenceService.ts"
layer: service
domain: booking
file: "server/services/venueIntelligenceService.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/venueIntelligenceService.ts

> **Ubicación:** `server/services/venueIntelligenceService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
VENUE & ARTIST INTELLIGENCE SERVICE (SERPER + SPOTIFY)

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
