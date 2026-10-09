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
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[ext_correo_smtp_imap|Correo SMTP / IMAP]] *(Layer: #external, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[ext_google_oauth_gmail|Google OAuth / Gmail API]] *(Layer: #external, Domain: #system)*
- [[ext_resend|Resend]] *(Layer: #external, Domain: #system)*
- [[ext_spotify|Spotify]] *(Layer: #external, Domain: #system)*
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_enlacesBandas|server/db/enlacesBandas.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_printSettings|server/db/printSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands_responseStrategies|server/routes/bands/responseStrategies.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_chat|server/routes/chat.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_leads|server/routes/leads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_emailValidation|server/routes/leads/emailValidation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_feedback|server/routes/leads/feedback.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_import|server/routes/leads/import.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_tours|server/routes/tours.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_chatTools|server/services/chatTools.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(Layer: #frontend, Domain: #system)*
- [[tabla_agent_execution_logs|tabla agent_execution_logs]] *(Layer: #schema, Domain: #system)*
- [[tabla_band_contacts|tabla band_contacts]] *(Layer: #schema, Domain: #system)*
- [[tabla_band_letras_auto|tabla band_letras_auto]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_booking_campaigns|tabla booking_campaigns]] *(Layer: #schema, Domain: #booking)*
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_letras_jobs|tabla letras_jobs]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_metricas_bandas_amigas|tabla metricas_bandas_amigas]] *(Layer: #schema, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_songs|tabla songs]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
