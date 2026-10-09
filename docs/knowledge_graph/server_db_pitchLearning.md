---
id: server_db_pitchLearning
title: "server/db/pitchLearning.ts"
layer: db
domain: booking
file: "server/db/pitchLearning.ts"
tags: ["db", "booking", "auto"]
---

# 📌 server/db/pitchLearning.ts

> **Ubicación:** `server/db/pitchLearning.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/booking`

## 📖 Descripción
Aprendizaje del Redactor: ediciones humanas de pitches, ejemplos few-shot y refinado automático

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_campaign_pitch_training|tabla campaign_pitch_training]] *(Layer: #schema, Domain: #booking)*
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_pitch_example_threads|tabla pitch_example_threads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_pitch_learning_examples|tabla pitch_learning_examples]] *(Layer: #schema, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[server_db|server/db.ts]] *(from #db)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/campaignToneDnaMerge.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
