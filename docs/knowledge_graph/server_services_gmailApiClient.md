---
id: server_services_gmailApiClient
title: "server/services/gmailApiClient.ts"
layer: service
domain: system
file: "server/services/gmailApiClient.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/gmailApiClient.ts

> **Ubicación:** `server/services/gmailApiClient.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Cliente de la API REST de Gmail para el servidor, con refresh token por banda (OAuth

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_correo_smtp_imap|Correo SMTP / IMAP]] *(Layer: #external, Domain: #system)*
- [[ext_google_oauth_gmail|Google OAuth / Gmail API]] *(Layer: #external, Domain: #system)*
- [[server_db_gmailOAuth|server/db/gmailOAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(Layer: #agent, Domain: #system)*
- [[server_utils_emailDeliveryTracker|server/utils/emailDeliveryTracker.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/gmailApiClient.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
