---
id: service_pitch_engine
title: "Pitch Engine & Multi-Model Routing"
layer: service
domain: booking
file: "server/services/pitchEngine.ts"
tags: ["service", "ai", "multi-model"]
---

# 📌 Pitch Engine & Multi-Model Routing

> **Ubicación:** `server/services/pitchEngine.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Motor de IA generativa con fallback automático Gemini ➔ DeepSeek ➔ OpenAI.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(Layer: #db, Domain: #booking)*
- [[server_routes_leads_feedback|server/routes/leads/feedback.ts]] *(Layer: #route, Domain: #booking)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(Layer: #agent, Domain: #system)*
- [[server_services_pitchJudge|server/services/pitchJudge.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(Layer: #service, Domain: #booking)*
- [[server_services_venueIntelligenceService|server/services/venueIntelligenceService.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_tourRouting|src/utils/tourRouting.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(from #security)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/pitchEngine.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
