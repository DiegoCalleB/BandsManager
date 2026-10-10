---
id: src_components_chatbot_hooks_useChatActions
title: "src/components/chatbot/hooks/useChatActions.ts"
layer: frontend
domain: system
file: "src/components/chatbot/hooks/useChatActions.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/chatbot/hooks/useChatActions.ts

> **Ubicación:** `src/components/chatbot/hooks/useChatActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Confirma, descarta y ejecuta las acciones propuestas por el asistente (leads, conciertos, ensayos, agentes).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useAgentTriggerAction|src/components/chatbot/hooks/useAgentTriggerAction.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_chatbot_hooks_useEntityActions|src/components/chatbot/hooks/useEntityActions.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useLeadEmailActions|src/components/chatbot/hooks/useLeadEmailActions.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatController|src/components/chatbot/hooks/useChatController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
