---
id: server_routes_bands
title: "server/routes/bands.ts"
layer: route
domain: system
file: "server/routes/bands.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/bands.ts

> **Ubicación:** `server/routes/bands.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
CRUD de bandas, borrado en bloque y sincronización. Toda operación resuelve la banda con

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_scout|Scout Discovery Agent]] *(Layer: #agent, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_printSettings|server/db/printSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_bands_responseStrategies|server/routes/bands/responseStrategies.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_emailTemplate|server/utils/emailTemplate.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_bandCRM_AIBandScoutModal|src/components/bandCRM/AIBandScoutModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_ChangeBandImageModal|src/components/bandCRM/ChangeBandImageModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_SpotifySweepModal|src/components/bandCRM/SpotifySweepModal.tsx]] *(from #frontend)*
- [[src_components_booking_BandPreviewPlayer|src/components/booking/BandPreviewPlayer.tsx]] *(from #frontend)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(from #frontend)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(from #agent)*
- [[src_components_dashboard_AlertSettingsModal|src/components/dashboard/AlertSettingsModal.tsx]] *(from #frontend)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(from #frontend)*
- [[src_components_repertorio_PdfExportModal|src/components/repertorio/PdfExportModal.tsx]] *(from #frontend)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/bandsAnalyzeTone.test.ts`
- `server/routes/__tests__/bandsRutasSombreadas.test.ts`
- `server/routes/__tests__/seguridadAutorizacion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
