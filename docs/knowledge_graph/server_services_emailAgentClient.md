---
id: server_services_emailAgentClient
title: "server/services/emailAgentClient.ts"
layer: agent
domain: system
file: "server/services/emailAgentClient.ts"
tags: ["agent", "system", "auto"]
---

# 📌 server/services/emailAgentClient.ts

> **Ubicación:** `server/services/emailAgentClient.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Cliente de email del lado del servidor, agnóstico de proveedor, para envío/lectura

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_emailAccounts|server/db/emailAccounts.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
