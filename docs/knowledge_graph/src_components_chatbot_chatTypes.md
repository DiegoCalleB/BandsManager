---
id: src_components_chatbot_chatTypes
title: "src/components/chatbot/chatTypes.ts"
layer: frontend
domain: system
file: "src/components/chatbot/chatTypes.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/chatbot/chatTypes.ts

> **Ubicación:** `src/components/chatbot/chatTypes.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contratos del chat del asistente: acciones propuestas y mensajes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_autonomyTypes|src/components/dashboard/agent_autonomy/autonomyTypes.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatContext|src/components/chatbot/ChatContext.ts]] *(from #frontend)*
- [[src_components_chatbot_ChatMessageBubble|src/components/chatbot/ChatMessageBubble.tsx]] *(from #frontend)*
- [[src_components_chatbot_hooks_useAgentRuns|src/components/chatbot/hooks/useAgentRuns.ts]] *(from #agent)*
- [[src_components_chatbot_hooks_useAgentTriggerAction|src/components/chatbot/hooks/useAgentTriggerAction.ts]] *(from #agent)*
- [[src_components_chatbot_hooks_useChatActions|src/components/chatbot/hooks/useChatActions.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useChatAudioGeneration|src/components/chatbot/hooks/useChatAudioGeneration.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useChatIdentity|src/components/chatbot/hooks/useChatIdentity.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useChatMessages|src/components/chatbot/hooks/useChatMessages.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useChatSend|src/components/chatbot/hooks/useChatSend.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useEntityActions|src/components/chatbot/hooks/useEntityActions.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useLeadEmailActions|src/components/chatbot/hooks/useLeadEmailActions.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
