---
id: server_services_jinaReaderService
title: "server/services/jinaReaderService.ts"
layer: service
domain: system
file: "server/services/jinaReaderService.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/jinaReaderService.ts

> **Ubicación:** `server/services/jinaReaderService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
JINA READER SERVICE (r.jina.ai)

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[server_services_apifyInstagramService|server/services/apifyInstagramService.ts]] *(from #service)*
- [[server_services_venueEventsRadarService|server/services/venueEventsRadarService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
