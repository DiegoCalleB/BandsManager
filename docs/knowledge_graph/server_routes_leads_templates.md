---
id: server_routes_leads_templates
title: "server/routes/leads/templates.ts"
layer: route
domain: booking
file: "server/routes/leads/templates.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/templates.ts

> **Ubicación:** `server/routes/leads/templates.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Plantillas de email: listar, guardar, previsualizar, optimizar y generar todas con IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(Layer: #db, Domain: #system)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*
- [[server_routes_leads_feedback|server/routes/leads/feedback.ts]] *(Layer: #route, Domain: #booking)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_emailValidator|server/utils/emailValidator.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_templateOptimizer|server/utils/templateOptimizer.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*
- [[src_components_campaign_CampaignManagerModal|src/components/campaign/CampaignManagerModal.tsx]] *(from #frontend)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyConfig|src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts]] *(from #agent)*
- [[src_hooks_useEmailTemplates|src/hooks/useEmailTemplates.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
