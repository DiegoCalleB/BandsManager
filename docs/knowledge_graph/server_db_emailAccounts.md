---
id: server_db_emailAccounts
title: "server/db/emailAccounts.ts"
layer: db
domain: system
file: "server/db/emailAccounts.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/emailAccounts.ts

> **Ubicación:** `server/db/emailAccounts.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Cuentas de email SMTP/IMAP por banda (`band_email_accounts`). `toSafeEmailAccountResponse` oculta

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_secretCrypto|server/utils/secretCrypto.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_band_email_accounts|tabla band_email_accounts]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/emailAccounts.test.ts`
- `server/services/__tests__/emailAgentClient.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
