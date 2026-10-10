---
id: src_components_chatbot_hooks_useAgentTriggerAction
title: "src/components/chatbot/hooks/useAgentTriggerAction.ts"
layer: agent
domain: system
file: "src/components/chatbot/hooks/useAgentTriggerAction.ts"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/chatbot/hooks/useAgentTriggerAction.ts

> **Ubicación:** `src/components/chatbot/hooks/useAgentTriggerAction.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Lanza un agente autónomo propuesto por el asistente y registra su ejecución para monitorizarla.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatActions|src/components/chatbot/hooks/useChatActions.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
