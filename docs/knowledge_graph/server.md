---
id: server
title: "server.ts"
layer: route
domain: system
file: "server.ts"
tags: ["route", "system", "auto"]
---

# 📌 server.ts

> **Ubicación:** `server.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Módulo sin exportaciones con nombre.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_scheduler|Agent Scheduler In-Process]] *(Layer: #agent, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_limiteCuerpo|server/middleware/limiteCuerpo.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[server_routes_agentQueue|server/routes/agentQueue.ts]] *(Layer: #agent, Domain: #system)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_billing|server/routes/billing.ts]] *(Layer: #route, Domain: #finances)*
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_chat|server/routes/chat.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_deals|server/routes/deals.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_donations|server/routes/donations.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_routes_leads|server/routes/leads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_posts|server/routes/posts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_reels|server/routes/reels.ts]] *(Layer: #route, Domain: #social)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_songs_index|server/routes/songs/index.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_spotify|server/routes/spotify.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_tours|server/routes/tours.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_transposeRoute|server/routes/transposeRoute.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_socialRadarService|server/services/socialRadarService.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_guardadoParcial|server/utils/guardadoParcial.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_version|server/utils/version.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
