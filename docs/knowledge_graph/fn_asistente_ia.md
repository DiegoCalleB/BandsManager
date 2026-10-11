---
id: fn_asistente_ia
title: "Asistente de IA (chat)"
layer: feature
domain: system
file: "src/components/Chatbot.tsx"
tags: ["feature", "system", "auto"]
---

# 📌 Asistente de IA (chat)

> **Ubicación:** `src/components/Chatbot.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/system`

## 📖 Descripción
Chatbot con herramientas que lee y actúa sobre los datos de la banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_routes_chat|server/routes/chat.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_leads|server/routes/leads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_emailValidation|server/routes/leads/emailValidation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_feedback|server/routes/leads/feedback.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_import|server/routes/leads/import.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*
- [[server_services_chatTools|server/services/chatTools.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(Layer: #frontend, Domain: #system)*
- [[tabla_agent_execution_logs|tabla agent_execution_logs]] *(Layer: #schema, Domain: #system)*
- [[tabla_booking_campaigns|tabla booking_campaigns]] *(Layer: #schema, Domain: #booking)*
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
