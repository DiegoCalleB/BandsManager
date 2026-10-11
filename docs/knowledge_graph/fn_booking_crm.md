---
id: fn_booking_crm
title: "Booking CRM y pitch"
layer: feature
domain: booking
file: "src/components/BookingCRM.tsx"
tags: ["feature", "booking", "auto"]
---

# 📌 Booking CRM y pitch

> **Ubicación:** `src/components/BookingCRM.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/booking`

## 📖 Descripción
Embudo de salas y festivales: leads, enriquecimiento, pitch con IA, respuestas y seguimiento.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(Layer: #db, Domain: #finances)*
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[ext_resend|Resend]] *(Layer: #external, Domain: #system)*
- [[ext_spotify|Spotify]] *(Layer: #external, Domain: #system)*
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(Layer: #hook, Domain: #booking)*
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_contacts|server/db/contacts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_deals|server/db/deals.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_db_exampleThreads|server/db/exampleThreads.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_fans|server/db/fans.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(Layer: #db, Domain: #booking)*
- [[server_db_production|server/db/production.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_social|server/db/social.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tours|server/db/tours.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_users|server/db/users.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_deals|server/routes/deals.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_leads|server/routes/leads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_emailValidation|server/routes/leads/emailValidation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_feedback|server/routes/leads/feedback.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_helpers|server/routes/leads/helpers.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_import|server/routes/leads/import.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(Layer: #service, Domain: #booking)*
- [[tabla_pitch_vector_store|tabla pitch_vector_store]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[ui_booking_crm|Booking CRM Component]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
