---
id: agent_redactor
title: "Agente Redactor (borradores de respuesta)"
layer: agent
domain: booking
file: "server/services/replyDrafting.ts"
tags: ["agent", "booking", "human-in-the-loop"]
---

# 📌 Agente Redactor (borradores de respuesta)

> **Ubicación:** `server/services/replyDrafting.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Redacta borradores de respuesta a salas. Nunca envía: el borrador pasa por aprobación humana.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(Layer: #db, Domain: #booking)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_sentimentAnalysis|server/services/sentimentAnalysis.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_leadLanguage|server/utils/leadLanguage.ts]] *(Layer: #service, Domain: #booking)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(from #security)*
- [[server_services_sentimentAnalysis|server/services/sentimentAnalysis.ts]] *(from #service)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/lectorAgentOrder.test.ts`
- `server/services/__tests__/replyDrafting.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
