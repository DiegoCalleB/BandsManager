---
id: server_services_setlistVenueService
title: "server/services/setlistVenueService.ts"
layer: service
domain: booking
file: "server/services/setlistVenueService.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/setlistVenueService.ts

> **Ubicación:** `server/services/setlistVenueService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
SETLIST.FM & SIMILAR BAND HISTORICAL VENUE SERVICE

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
