---
id: route_leads_reply
title: "Leads Reply Route"
layer: route
domain: booking
file: "server/routes/leads/reply.ts"
tags: ["api", "route", "reply", "ai"]
---

# 📌 Leads Reply Route

> **Ubicación:** `server/routes/leads/reply.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Endpoint para redacción automática de respuestas en hilos de negociación.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(Layer: #db, Domain: #booking)*
- [[server_services_sentimentAnalysis|server/services/sentimentAnalysis.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_leadLanguage|server/utils/leadLanguage.ts]] *(Layer: #service, Domain: #booking)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
