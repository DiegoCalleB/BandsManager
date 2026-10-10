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
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_ensayos|Ensayos]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[fn_gira|Tour Manager]] *(from #feature)*
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[fn_metricas_panel|Panel y métricas]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[fn_scout_salas|Búsqueda de salas y festivales]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_bandCRM_AIBandScoutModal|src/components/bandCRM/AIBandScoutModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_ChangeBandImageModal|src/components/bandCRM/ChangeBandImageModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_SpotifySweepModal|src/components/bandCRM/SpotifySweepModal.tsx]] *(from #frontend)*
- [[src_components_booking_BandPreviewPlayer|src/components/booking/BandPreviewPlayer.tsx]] *(from #frontend)*
- [[src_components_calendar_hooks_useEventReminder|src/components/calendar/hooks/useEventReminder.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useEntityActions|src/components/chatbot/hooks/useEntityActions.ts]] *(from #frontend)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyConfig|src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts]] *(from #agent)*
- [[src_components_dashboard_AlertSettingsModal|src/components/dashboard/AlertSettingsModal.tsx]] *(from #frontend)*
- [[src_components_reels_center_hooks_useBandToneAnalysis|src/components/reels_center/hooks/useBandToneAnalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_hooks_usePrintSettingsPersistence|src/components/repertorio/pdf_export/hooks/usePrintSettingsPersistence.ts]] *(from #frontend)*
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
