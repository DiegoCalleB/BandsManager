---
id: server_db_core
title: "server/db/core.ts"
layer: db
domain: system
file: "server/db/core.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/core.ts

> **Ubicación:** `server/db/core.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: rolDeClaveSupabase, getSupabase, normalizePlan, cleanBandId.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_agent_schedule|Estado del Scheduler de agentes]] *(from #db)*
- [[db_ai_ledger|AI Token Ledger]] *(from #db)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(from #db)*
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(from #db)*
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[server_auth|server/auth.ts]] *(from #security)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(from #db)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(from #db)*
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[server_db_calendarConflicts|server/db/calendarConflicts.ts]] *(from #db)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(from #db)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(from #db)*
- [[server_db_concerts|server/db/concerts.ts]] *(from #db)*
- [[server_db_contacts|server/db/contacts.ts]] *(from #db)*
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(from #db)*
- [[server_db_emailAccounts|server/db/emailAccounts.ts]] *(from #db)*
- [[server_db_enlacesBandas|server/db/enlacesBandas.ts]] *(from #db)*
- [[server_db_enlacesCortos|server/db/enlacesCortos.ts]] *(from #db)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*
- [[server_db_exampleThreads|server/db/exampleThreads.ts]] *(from #db)*
- [[server_db_fans|server/db/fans.ts]] *(from #db)*
- [[server_db_gmailOAuth|server/db/gmailOAuth.ts]] *(from #security)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[server_db_printSettings|server/db/printSettings.ts]] *(from #db)*
- [[server_db_production|server/db/production.ts]] *(from #db)*
- [[server_db_reelAnalyses|server/db/reelAnalyses.ts]] *(from #db)*
- [[server_db_referidos|server/db/referidos.ts]] *(from #db)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(from #db)*
- [[server_db_schedule|server/db/schedule.ts]] *(from #db)*
- [[server_db_social|server/db/social.ts]] *(from #db)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_db_tours|server/db/tours.ts]] *(from #db)*
- [[server_db_users|server/db/users.ts]] *(from #db)*
- [[server_db_webhooks|server/db/webhooks.ts]] *(from #db)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(from #agent)*
- [[server_services_agentQueueService|server/services/agentQueueService.ts]] *(from #agent)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(from #service)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(from #agent)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(from #service)*
- [[server_services_perfilPublicoBanda|server/services/perfilPublicoBanda.ts]] *(from #service)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(from #service)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(from #service)*
- [[server_services_stemStorageRetryQueue|server/services/stemStorageRetryQueue.ts]] *(from #service)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/core.test.ts`
- `server/db/__tests__/rolClaveSupabase.test.ts`
- `server/routes/__tests__/billing.test.ts`
- `server/routes/__tests__/buildAvailableBandsForUser.test.ts`
- `server/services/__tests__/emailAgentClient.test.ts`
- `server/services/__tests__/stemWebhookAndLocks.test.ts`
- `server/services/__tests__/stemsReintento.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
