---
id: server_services_bandsintownVenueService
title: "server/services/bandsintownVenueService.ts"
layer: service
domain: booking
file: "server/services/bandsintownVenueService.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/bandsintownVenueService.ts

> **Ubicación:** `server/services/bandsintownVenueService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: BandsintownVenueEvent, getVenuesFromBandsintown.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_scout_salas|Búsqueda de salas y festivales]] *(from #feature)*
- [[server_services_similarBandsVenueMatcherService|server/services/similarBandsVenueMatcherService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
