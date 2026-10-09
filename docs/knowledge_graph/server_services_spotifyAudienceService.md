---
id: server_services_spotifyAudienceService
title: "server/services/spotifyAudienceService.ts"
layer: service
domain: system
file: "server/services/spotifyAudienceService.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/spotifyAudienceService.ts

> **Ubicación:** `server/services/spotifyAudienceService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
SPOTIFY AUDIENCE & CITY DEMAND INTELLIGENCE SERVICE

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
