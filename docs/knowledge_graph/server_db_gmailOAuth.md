---
id: server_db_gmailOAuth
title: "server/db/gmailOAuth.ts"
layer: security
domain: auth
file: "server/db/gmailOAuth.ts"
tags: ["security", "auth", "auto"]
---

# 📌 server/db/gmailOAuth.ts

> **Ubicación:** `server/db/gmailOAuth.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/auth`

## 📖 Descripción
Cuentas Gmail OAuth2 por banda (`band_gmail_oauth_accounts`). `toSafeGmailOAuthResponse` oculta

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_secretCrypto|server/utils/secretCrypto.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_band_gmail_oauth_accounts|tabla band_gmail_oauth_accounts]] *(Layer: #schema, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/gmailOAuth.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
