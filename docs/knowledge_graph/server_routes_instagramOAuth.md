---
id: server_routes_instagramOAuth
title: "server/routes/instagramOAuth.ts"
layer: security
domain: auth
file: "server/routes/instagramOAuth.ts"
tags: ["security", "auth", "auto"]
---

# 📌 server/routes/instagramOAuth.ts

> **Ubicación:** `server/routes/instagramOAuth.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/auth`

## 📖 Descripción
OAuth de Instagram (Meta) por banda: sustituye al alta pegando un token a mano. La banda pulsa

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_instagramConexion|server/services/instagramConexion.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_oauthEstado|server/utils/oauthEstado.ts]] *(Layer: #security, Domain: #auth)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/instagramOAuth.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
