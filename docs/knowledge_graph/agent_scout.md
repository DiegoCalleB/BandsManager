---
id: agent_scout
title: "Scout Discovery Agent"
layer: agent
domain: booking
file: "server/auto_enrichment.ts"
tags: ["agent", "scout", "enrichment"]
---

# 📌 Scout Discovery Agent

> **Ubicación:** `server/auto_enrichment.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Descubre y enriquece información de salas registrándolas en estado nuevo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_jinaReaderService|server/services/jinaReaderService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_venueIntelligenceService|server/services/venueIntelligenceService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_leadLanguage|server/utils/leadLanguage.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_scoutLeads|server/utils/scoutLeads.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_spanishFestivalsDB|server/utils/spanishFestivalsDB.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(from #security)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
