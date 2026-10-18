---
id: server_routes_gmailOAuth
title: "server/routes/gmailOAuth.ts"
layer: security
domain: auth
file: "server/routes/gmailOAuth.ts"
tags: ["security", "auth", "auto"]
---

# 📌 server/routes/gmailOAuth.ts

> **Ubicación:** `server/routes/gmailOAuth.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/auth`

## 📖 Descripción
OAuth "offline" de Gmail por banda: una banda conecta su cuenta UNA vez y el backend guarda

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[ext_google_oauth_gmail|Google OAuth / Gmail API]] *(Layer: #external, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_gmailOAuth|server/db/gmailOAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_gmailConexion|server/services/gmailConexion.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/codeqlPR235Rutas.test.ts`
- `server/routes/__tests__/gmailOAuthEstado.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
