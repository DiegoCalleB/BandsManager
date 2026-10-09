---
id: server_ai
title: "server/ai.ts"
layer: service
domain: system
file: "server/ai.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/ai.ts

> **Ubicación:** `server/ai.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: GEMINI_MODEL, TIMEOUT_IA_MS, TIMEOUT_IA_LARGO_MS, FALLBACK_MODELS, getAiClient, getDeepSeekKey, AI_PRICING_TABLE, estimateTokens.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(from #route)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(from #agent)*
- [[server_services_bandsintownVenueService|server/services/bandsintownVenueService.ts]] *(from #service)*
- [[server_services_googlePlacesVenueService|server/services/googlePlacesVenueService.ts]] *(from #service)*
- [[server_services_multiSourceVenueDiscoveryService|server/services/multiSourceVenueDiscoveryService.ts]] *(from #service)*
- [[server_services_pitchJudge|server/services/pitchJudge.ts]] *(from #service)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(from #service)*
- [[server_services_publicCulturalEventsRadarService|server/services/publicCulturalEventsRadarService.ts]] *(from #service)*
- [[server_services_sentimentAnalysis|server/services/sentimentAnalysis.ts]] *(from #service)*
- [[server_services_setlistVenueService|server/services/setlistVenueService.ts]] *(from #service)*
- [[server_services_similarBandsVenueMatcherService|server/services/similarBandsVenueMatcherService.ts]] *(from #service)*
- [[server_services_socialEngagementService|server/services/socialEngagementService.ts]] *(from #service)*
- [[server_services_spotifyAudienceService|server/services/spotifyAudienceService.ts]] *(from #service)*
- [[server_services_tourLogisticsService|server/services/tourLogisticsService.ts]] *(from #service)*
- [[server_services_venueEventsRadarService|server/services/venueEventsRadarService.ts]] *(from #service)*
- [[server_utils_enrichCoversWithoutAudio|server/utils/enrichCoversWithoutAudio.ts]] *(from #service)*
- [[server_utils_perfectSetlistPlanner|server/utils/perfectSetlistPlanner.ts]] *(from #service)*
- [[server_utils_setlistAIAnalyzer|server/utils/setlistAIAnalyzer.ts]] *(from #service)*
- [[server_utils_setlistImport|server/utils/setlistImport.ts]] *(from #service)*
- [[server_utils_templateOptimizer|server/utils/templateOptimizer.ts]] *(from #service)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/__tests__/ai_fallback.test.ts`
- `server/utils/__tests__/enrichCoversWithoutAudio.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
