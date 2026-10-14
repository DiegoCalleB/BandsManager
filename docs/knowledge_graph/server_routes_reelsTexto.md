---
id: server_routes_reelsTexto
title: "server/routes/reelsTexto.ts"
layer: route
domain: social
file: "server/routes/reelsTexto.ts"
tags: ["route", "social", "auto"]
---

# 📌 server/routes/reelsTexto.ts

> **Ubicación:** `server/routes/reelsTexto.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/social`

## 📖 Descripción
Reels · texto: lo que trabaja sobre el copy y el gancho del reel, no sobre el vídeo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_hookDoctor|server/services/hookDoctor.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_perfilDeLaPeticion|server/services/perfilDeLaPeticion.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
