---
id: src_components_chatbot_hooks_useAgentRuns
title: "src/components/chatbot/hooks/useAgentRuns.ts"
layer: agent
domain: system
file: "src/components/chatbot/hooks/useAgentRuns.ts"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/chatbot/hooks/useAgentRuns.ts

> **Ubicación:** `src/components/chatbot/hooks/useAgentRuns.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Estado de los agentes autónomos, su configuración y el seguimiento de la ejecución activa.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatController|src/components/chatbot/hooks/useChatController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
