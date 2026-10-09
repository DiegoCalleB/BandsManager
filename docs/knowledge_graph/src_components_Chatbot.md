---
id: src_components_Chatbot
title: "src/components/Chatbot.tsx"
layer: frontend
domain: system
file: "src/components/Chatbot.tsx"
tags: ["frontend", "system", "auto", "pantalla"]
---

# 📌 src/components/Chatbot.tsx

> **Ubicación:** `src/components/Chatbot.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ProposedAction, ChatMessage, Chatbot.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_chat|server/routes/chat.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_tours|server/routes/tours.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_chatbot_ChatbotHeader|src/components/chatbot/ChatbotHeader.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_ChatbotModeSwitcher|src/components/chatbot/ChatbotModeSwitcher.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_accompanimentSynth|src/utils/accompanimentSynth.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_instrumentSynth|src/utils/instrumentSynth.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_midiExport|src/utils/midiExport.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatbotHeader|src/components/chatbot/ChatbotHeader.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
