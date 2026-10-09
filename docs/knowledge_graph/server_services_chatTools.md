---
id: server_services_chatTools
title: "server/services/chatTools.ts"
layer: service
domain: system
file: "server/services/chatTools.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/chatTools.ts

> **Ubicación:** `server/services/chatTools.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: chatFunctionDeclarations, convertFunctionCallsToProposedActions.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
