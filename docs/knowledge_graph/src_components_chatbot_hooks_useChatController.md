---
id: src_components_chatbot_hooks_useChatController
title: "src/components/chatbot/hooks/useChatController.ts"
layer: frontend
domain: system
file: "src/components/chatbot/hooks/useChatController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/chatbot/hooks/useChatController.ts

> **Ubicación:** `src/components/chatbot/hooks/useChatController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Compone los hooks del chat (identidad, mensajes, voz, agentes, audio, formato, envío y acciones).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_chatbot_chatFormatting|src/components/chatbot/chatFormatting.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useAgentRuns|src/components/chatbot/hooks/useAgentRuns.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_chatbot_hooks_useChatActions|src/components/chatbot/hooks/useChatActions.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useChatAudioGeneration|src/components/chatbot/hooks/useChatAudioGeneration.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chatbot_hooks_useChatIdentity|src/components/chatbot/hooks/useChatIdentity.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useChatMessages|src/components/chatbot/hooks/useChatMessages.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useChatSend|src/components/chatbot/hooks/useChatSend.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useVoiceInput|src/components/chatbot/hooks/useVoiceInput.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatContext|src/components/chatbot/ChatContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
