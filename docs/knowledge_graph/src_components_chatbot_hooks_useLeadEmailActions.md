---
id: src_components_chatbot_hooks_useLeadEmailActions
title: "src/components/chatbot/hooks/useLeadEmailActions.ts"
layer: frontend
domain: booking
file: "src/components/chatbot/hooks/useLeadEmailActions.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/chatbot/hooks/useLeadEmailActions.ts

> **Ubicación:** `src/components/chatbot/hooks/useLeadEmailActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Aprueba leads y crea/envía borradores de email a través del agente enviador.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatActions|src/components/chatbot/hooks/useChatActions.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
