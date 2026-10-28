---
id: server_middleware_rateLimiter
title: "server/middleware/rateLimiter.ts"
layer: security
domain: system
file: "server/middleware/rateLimiter.ts"
tags: ["security", "system", "auto"]
---

# 📌 server/middleware/rateLimiter.ts

> **Ubicación:** `server/middleware/rateLimiter.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: _vaciarRateLimitStore, ipDelCliente, createRateLimiter, loginRateLimiter, registroRateLimiter, publicoRateLimiter, gmailOAuthRateLimiter, webhookRateLimiter.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_ai_music_rutaSeparacion|server/routes/ai_music/rutaSeparacion.ts]] *(from #route)*
- [[server_routes_ai_music_rutasGeneracion|server/routes/ai_music/rutasGeneracion.ts]] *(from #route)*
- [[server_routes_ai_music_rutasWebhooks|server/routes/ai_music/rutasWebhooks.ts]] *(from #route)*
- [[server_routes_asesor|server/routes/asesor.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[server_routes_catalogo|server/routes/catalogo.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_contactoEmpresas|server/routes/contactoEmpresas.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*
- [[server_routes_emailsCicloVida|server/routes/emailsCicloVida.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_fans_contador|server/routes/fans_contador.ts]] *(from #route)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_routes_interesados|server/routes/interesados.ts]] *(from #route)*
- [[server_routes_leads_placesPhoto|server/routes/leads/placesPhoto.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_paginasSeo|server/routes/paginasSeo.ts]] *(from #route)*
- [[server_routes_pegatinas|server/routes/pegatinas.ts]] *(from #route)*
- [[server_routes_presentacionTfm|server/routes/presentacionTfm.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_reelsTexto|server/routes/reelsTexto.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*
- [[server_routes_users_rutasGoogle|server/routes/users/rutasGoogle.ts]] *(from #route)*
- [[server_routes_users_rutasInvitacion|server/routes/users/rutasInvitacion.ts]] *(from #route)*
- [[server_routes_users_rutasLogin|server/routes/users/rutasLogin.ts]] *(from #route)*
- [[server_routes_users_rutasRecuperacion|server/routes/users/rutasRecuperacion.ts]] *(from #route)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/middleware/__tests__/rateLimiter.test.ts`
- `server/middleware/__tests__/rateLimiterIp.test.ts`
- `server/routes/__tests__/reelsRoute.test.ts`
- `server/routes/__tests__/reelsTexto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
