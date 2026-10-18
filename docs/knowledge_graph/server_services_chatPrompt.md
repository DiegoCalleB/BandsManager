---
id: server_services_chatPrompt
title: "server/services/chatPrompt.ts"
layer: service
domain: system
file: "server/services/chatPrompt.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/chatPrompt.ts

> **Ubicación:** `server/services/chatPrompt.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Prompt del chatbot (`/chat`). Las INSTRUCCIONES van en la instrucción de sistema y no contienen nada que

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_routes_leads|server/routes/leads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_services_chatLecturas|server/services/chatLecturas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_chatPromptBloques|server/utils/chatPromptBloques.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
