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
Exporta: _vaciarRateLimitStore, ipDelCliente, createRateLimiter, loginRateLimiter, registroRateLimiter, publicoRateLimiter, reenvioEmailRateLimiter, iaRateLimiter.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/middleware/__tests__/rateLimiter.test.ts`
- `server/middleware/__tests__/rateLimiterIp.test.ts`
- `server/routes/__tests__/reelsRoute.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
