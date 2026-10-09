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
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_gmailOAuth|server/db/gmailOAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/gmailOAuthEstado.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
